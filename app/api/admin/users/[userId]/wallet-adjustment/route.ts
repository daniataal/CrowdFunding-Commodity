import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireDbRole } from "@/lib/authz"
import { z } from "zod"
import { createBalancedLedgerEntry, getOrCreateAdminAdjustmentAccount, getOrCreateUserWalletAccount } from "@/lib/ledger"
import { RISK_LIMITS } from "@/lib/risk-limits"

const schema = z.object({
  amount: z.number().refine((n) => Number.isFinite(n) && n !== 0, "Amount must be non-zero"),
  type: z.enum(["REFUND", "PAYOUT", "DIVIDEND", "DEPOSIT", "WITHDRAWAL", "INVESTMENT"]).default("REFUND"),
  reason: z.string().trim().min(3, "Reason is required"),
})

export async function POST(request: NextRequest, context: { params: Promise<{ userId: string }> }) {
  const gate = await requireDbRole(["ADMIN"])
  if (!gate.ok) {
    return NextResponse.json({ error: gate.status === 403 ? "Forbidden" : "Unauthorized" }, { status: gate.status })
  }

  const { userId } = await context.params
  if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 })

  const body = await request.json()
  const validated = schema.parse(body)
  const absAmount = Math.abs(validated.amount)

  // Two-person control for large manual adjustments.
  if (absAmount >= RISK_LIMITS.twoPersonWalletAdjustmentAbs) {
    const approval = await prisma.adminApprovalRequest.create({
      data: {
        action: "WALLET_ADJUSTMENT",
        status: "PENDING",
        entityType: "User",
        entityId: userId,
        requestedBy: gate.userId,
        payload: validated,
      },
    })
    return NextResponse.json(
      { error: "Two-person approval required", requiresApproval: true, approvalId: approval.id },
      { status: 202 }
    )
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, walletBalance: true },
  })
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const result = await prisma.$transaction(async (tx) => {
    const [wallet, adminAdj] = await Promise.all([
      getOrCreateUserWalletAccount(tx, userId),
      getOrCreateAdminAdjustmentAccount(tx),
    ])

    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: { walletBalance: { increment: validated.amount } },
      select: { walletBalance: true },
    })

    const transaction = await tx.transaction.create({
      data: {
        userId,
        type: validated.type as any,
        amount: validated.amount,
        status: "COMPLETED",
        description: `Admin adjustment: ${validated.reason}`,
        metadata: {
          adminAdjustment: true,
          adminUserId: gate.userId,
          reason: validated.reason,
        },
      },
    })

    const abs = Math.abs(validated.amount)
    await createBalancedLedgerEntry(tx, {
      type: "ADJUSTMENT",
      description: `Admin adjustment: ${validated.reason}`,
      userId,
      transactionId: transaction.id,
      metadata: { adminUserId: gate.userId, reason: validated.reason, type: validated.type },
      lines:
        validated.amount >= 0
          ? [
              { accountId: adminAdj.id, debit: abs },
              { accountId: wallet.id, credit: abs },
            ]
          : [
              { accountId: wallet.id, debit: abs },
              { accountId: adminAdj.id, credit: abs },
            ],
    })

    await tx.auditLog.create({
      data: {
        userId: gate.userId,
        action: "WALLET_ADJUSTMENT",
        entityType: "User",
        entityId: userId,
        changes: {
          amount: validated.amount,
          type: validated.type,
          reason: validated.reason,
          transactionId: transaction.id,
        },
      },
    })

    return { transactionId: transaction.id, newBalance: Number(updatedUser.walletBalance) }
  })

  return NextResponse.json({ success: true, data: result })
}


