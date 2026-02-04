import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireDbRole } from "@/lib/authz"
import { z } from "zod"
import { createBalancedLedgerEntry, getOrCreatePayoutExpenseAccount, getOrCreateUserWalletAccount } from "@/lib/ledger"
import { RISK_LIMITS } from "@/lib/risk-limits"

const schema = z.object({
  totalPayout: z.number().positive(),
  markSettled: z.boolean().optional().default(true),
  force: z.boolean().optional().default(false),
  idempotencyKey: z.string().optional(),
})

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const gate = await requireDbRole(["ADMIN"])
  if (!gate.ok) {
    return NextResponse.json({ error: gate.status === 403 ? "Forbidden" : "Unauthorized" }, { status: gate.status })
  }

  const { id } = await context.params
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  const body = await request.json()
  const validated = schema.parse(body)
  const headerKey = request.headers.get("Idempotency-Key") || request.headers.get("X-Idempotency-Key")
  const idempotencyKey = headerKey ?? validated.idempotencyKey

  // Idempotency (stronger than "already exists"): if key was used, return stored success.
  if (idempotencyKey) {
    const existingKey = await prisma.idempotencyKey.findUnique({
      where: { userId_scope_key: { userId: gate.userId, scope: `admin:payouts:${id}`, key: idempotencyKey } },
    })
    if (existingKey?.status === "COMPLETED" && existingKey.responseJson) {
      return NextResponse.json({ success: true, data: existingKey.responseJson })
    }
  }

  // Guard: if any payouts already exist for this deal, refuse.
  const existingPayout = await prisma.transaction.findFirst({
    where: { commodityId: id, type: "PAYOUT" },
    select: { id: true },
  })
  if (existingPayout) {
    return NextResponse.json({ error: "Payouts already distributed for this deal" }, { status: 400 })
  }

  const commodity = await prisma.commodity.findUnique({ where: { id } })
  if (!commodity) return NextResponse.json({ error: "Deal not found" }, { status: 404 })

  // By default, only allow payouts after RELEASED (post-inspection). Admin can override with force.
  if (!validated.force && commodity.status !== "RELEASED") {
    return NextResponse.json({ error: "Deal must be RELEASED before distributing payouts (or use force)" }, { status: 400 })
  }

  // Two-person control: require a second admin approval for large distributions.
  if (!validated.force && validated.totalPayout >= RISK_LIMITS.twoPersonPayoutTotal) {
    const approval = await prisma.adminApprovalRequest.create({
      data: {
        action: "DISTRIBUTE_PAYOUTS",
        status: "PENDING",
        entityType: "Commodity",
        entityId: id,
        requestedBy: gate.userId,
        payload: {
          totalPayout: validated.totalPayout,
          markSettled: validated.markSettled,
          idempotencyKey,
        },
      },
    })
    return NextResponse.json(
      { error: "Two-person approval required", requiresApproval: true, approvalId: approval.id },
      { status: 202 }
    )
  }

  const investments = await prisma.investment.findMany({
    where: { commodityId: id },
    select: { id: true, userId: true, amount: true },
  })
  if (investments.length === 0) {
    return NextResponse.json({ error: "No investments found for this deal" }, { status: 400 })
  }

  const totalInvested = investments.reduce((sum, inv) => sum + Number(inv.amount), 0)
  if (totalInvested <= 0) {
    return NextResponse.json({ error: "Invalid investment totals" }, { status: 400 })
  }

  // Aggregate payout per user (some users may have multiple investments).
  const payoutByUser = new Map<string, number>()
  const payoutByInvestment = new Map<string, number>()
  for (const inv of investments) {
    const share = Number(inv.amount) / totalInvested
    const payout = validated.totalPayout * share
    payoutByInvestment.set(inv.id, payout)
    payoutByUser.set(inv.userId, (payoutByUser.get(inv.userId) ?? 0) + payout)
  }

  const now = new Date()

  const result = await prisma.$transaction(async (tx) => {
    if (idempotencyKey) {
      await tx.idempotencyKey.upsert({
        where: { userId_scope_key: { userId: gate.userId, scope: `admin:payouts:${id}`, key: idempotencyKey } },
        create: { userId: gate.userId, scope: `admin:payouts:${id}`, key: idempotencyKey, status: "IN_PROGRESS" },
        update: { status: "IN_PROGRESS", error: null },
      })
    }

    // Re-check inside transaction for safety.
    const again = await tx.transaction.findFirst({ where: { commodityId: id, type: "PAYOUT" }, select: { id: true } })
    if (again) throw new Error("Payouts already distributed for this deal")

    // Update wallets and create payout transactions.
    for (const [userId, payout] of payoutByUser.entries()) {
      // Wallet freeze should block adjustments unless admin is explicitly distributing payouts.
      await tx.user.update({
        where: { id: userId },
        data: { walletBalance: { increment: payout } },
      })
    }

    // Update investments with actual returns (profit) and settled status.
    for (const inv of investments) {
      const payout = payoutByInvestment.get(inv.id) ?? 0
      const profit = payout - Number(inv.amount)
      await tx.investment.update({
        where: { id: inv.id },
        data: { actualReturn: profit, status: "SETTLED" },
      })
    }

    await tx.transaction.createMany({
      data: Array.from(payoutByUser.entries()).map(([userId, payout]) => ({
        userId,
        commodityId: id,
        type: "PAYOUT",
        amount: payout,
        status: "COMPLETED",
        description: `Payout distribution for ${commodity.name}`,
        metadata: {
          totalPayout: validated.totalPayout,
          totalInvested,
          distributedAt: now.toISOString(),
        },
      })),
    })

    // Ledger: one balanced entry for the whole distribution.
    const payoutExpense = await getOrCreatePayoutExpenseAccount(tx)
    const walletAccounts = await Promise.all(
      Array.from(payoutByUser.keys()).map((userId) => getOrCreateUserWalletAccount(tx, userId))
    )
    const walletByUser = new Map(walletAccounts.map((a: any) => [a.userId, a]))

    await createBalancedLedgerEntry(tx, {
      type: "PAYOUT",
      description: `Payout distribution for ${commodity.name}`,
      commodityId: id,
      metadata: { totalPayout: validated.totalPayout, totalInvested, distributedAt: now.toISOString() },
      lines: [
        { accountId: payoutExpense.id, debit: validated.totalPayout },
        ...Array.from(payoutByUser.entries()).map(([userId, payout]) => ({
          accountId: (walletByUser.get(userId) as any).id,
          credit: payout,
        })),
      ],
    })

    if (validated.markSettled) {
      await tx.commodity.update({ where: { id }, data: { status: "SETTLED" } })
    }

    await tx.auditLog.create({
      data: {
        userId: gate.userId,
        action: "DISTRIBUTE_PAYOUTS",
        entityType: "Commodity",
        entityId: id,
        changes: {
          totalPayout: validated.totalPayout,
          totalInvested,
          investors: payoutByUser.size,
          investments: investments.length,
          markSettled: validated.markSettled,
        },
      },
    })

    const response = {
      investors: payoutByUser.size,
      investments: investments.length,
      totalInvested,
      totalPayout: validated.totalPayout,
    }

    if (idempotencyKey) {
      await tx.idempotencyKey.update({
        where: { userId_scope_key: { userId: gate.userId, scope: `admin:payouts:${id}`, key: idempotencyKey } },
        data: { status: "COMPLETED", responseJson: response, error: null },
      })
    }

    return response
  })

  return NextResponse.json({ success: true, data: result })
}


