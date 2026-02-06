import { NextRequest, NextResponse } from "next/server"
import { requireDbRole } from "@/lib/authz"
import { prisma } from "@/lib/prisma"
import {
  createBalancedLedgerEntry,
  getOrCreateAdminAdjustmentAccount,
  getOrCreateUserWalletAccount,
  getOrCreatePayoutExpenseAccount,
} from "@/lib/ledger"

export async function POST(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const gate = await requireDbRole(["ADMIN"])
  if (!gate.ok) {
    return NextResponse.json({ error: gate.status === 403 ? "Forbidden" : "Unauthorized" }, { status: gate.status })
  }

  const { id } = await context.params
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  const req = await prisma.adminApprovalRequest.findUnique({ where: { id } })
  if (!req) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (req.status !== "PENDING") return NextResponse.json({ error: "Not pending" }, { status: 400 })
  if (req.requestedBy === gate.userId) {
    return NextResponse.json({ error: "Second approver must be different admin" }, { status: 400 })
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Execute based on action
      if (req.action === "WALLET_ADJUSTMENT") {
        const payload = req.payload as { amount: number; type: string; reason: string }
        const { amount, type, reason } = payload
        const userId = req.entityId
        if (!userId) throw new Error("Missing userId for wallet adjustment")

        const [wallet, adminAdj] = await Promise.all([
          getOrCreateUserWalletAccount(tx, userId),
          getOrCreateAdminAdjustmentAccount(tx),
        ])

        // Update user balance
        await tx.user.update({
          where: { id: userId },
          data: { walletBalance: { increment: amount } },
        })

        // Create Transaction record
        const transaction = await tx.transaction.create({
          data: {
            userId,
            type: type as any,
            amount: amount,
            status: "COMPLETED",
            description: `Admin adjustment (Approved): ${reason}`,
            metadata: {
              adminAdjustment: true,
              adminUserId: req.requestedBy,
              approverUserId: gate.userId,
              reason: reason,
            },
          },
        })

        // Create Ledger Entry
        const abs = Math.abs(amount)
        await createBalancedLedgerEntry(tx, {
          type: "ADJUSTMENT",
          description: `Admin adjustment (Approved): ${reason}`,
          userId,
          transactionId: transaction.id,
          metadata: { adminUserId: req.requestedBy, approverUserId: gate.userId, reason: reason, type: type },
          lines:
            amount >= 0
              ? [
                { accountId: adminAdj.id, debit: abs },
                { accountId: wallet.id, credit: abs },
              ]
              : [
                { accountId: wallet.id, debit: abs },
                { accountId: adminAdj.id, credit: abs },
              ],
        })

      } else if (req.action === "DISTRIBUTE_PAYOUTS") {
        const payload = req.payload as { totalPayout: number; markSettled: boolean; idempotencyKey?: string }
        const { totalPayout, markSettled } = payload
        const commodityId = req.entityId
        if (!commodityId) throw new Error("Missing commodityId for payout")

        // 1. Guard against duplicates
        const existingPayout = await tx.transaction.findFirst({
          where: { commodityId, type: "PAYOUT" },
          select: { id: true },
        })
        if (existingPayout) throw new Error("Payouts already distributed for this deal")

        // 2. Fetch Deal & Investments
        const commodity = await tx.commodity.findUnique({ where: { id: commodityId } })
        if (!commodity) throw new Error("Deal not found")

        const investments = await tx.investment.findMany({
          where: { commodityId },
          select: { id: true, userId: true, amount: true },
        })
        if (investments.length === 0) throw new Error("No investments found for this deal")

        const totalInvested = investments.reduce((sum, inv) => sum + Number(inv.amount), 0)
        if (totalInvested <= 0) throw new Error("Invalid investment totals")

        // 3. Calculate Payouts
        const payoutByUser = new Map<string, number>()
        const payoutByInvestment = new Map<string, number>()
        for (const inv of investments) {
          const share = Number(inv.amount) / totalInvested
          const payout = totalPayout * share
          payoutByInvestment.set(inv.id, payout)
          payoutByUser.set(inv.userId, (payoutByUser.get(inv.userId) ?? 0) + payout)
        }

        // 4. Update Wallets
        for (const [userId, payout] of payoutByUser.entries()) {
          await tx.user.update({
            where: { id: userId },
            data: { walletBalance: { increment: payout } },
          })
        }

        // 5. Update Investments (Settled)
        for (const inv of investments) {
          const payout = payoutByInvestment.get(inv.id) ?? 0
          const profit = payout - Number(inv.amount)
          await tx.investment.update({
            where: { id: inv.id },
            data: { actualReturn: profit, status: "SETTLED" },
          })
        }

        const now = new Date()

        // 6. Create Transactions
        await tx.transaction.createMany({
          data: Array.from(payoutByUser.entries()).map(([userId, payout]) => ({
            userId,
            commodityId,
            type: "PAYOUT",
            amount: payout,
            status: "COMPLETED",
            description: `Payout distribution for ${commodity.name}`,
            metadata: {
              totalPayout: totalPayout,
              totalInvested,
              distributedAt: now.toISOString(),
              approverUserId: gate.userId,
              requesterUserId: req.requestedBy,
            },
          })),
        })

        // 7. Ledger Entry (Aggregated)
        const payoutExpense = await getOrCreatePayoutExpenseAccount(tx)
        const walletAccounts = await Promise.all(
          Array.from(payoutByUser.keys()).map((userId) => getOrCreateUserWalletAccount(tx, userId))
        )
        const walletByUser = new Map(walletAccounts.map((a: any) => [a.userId, a]))

        await createBalancedLedgerEntry(tx, {
          type: "PAYOUT",
          description: `Payout distribution for ${commodity.name}`,
          commodityId,
          metadata: { totalPayout, totalInvested, distributedAt: now.toISOString() },
          lines: [
            { accountId: payoutExpense.id, debit: totalPayout },
            ...Array.from(payoutByUser.entries()).map(([userId, payout]) => ({
              accountId: (walletByUser.get(userId) as any).id,
              credit: payout,
            })),
          ],
        })

        // 8. Mark Deal Settled
        if (markSettled) {
          await tx.commodity.update({ where: { id: commodityId }, data: { status: "SETTLED" } })
        }

      } else {
        throw new Error(`Unknown approval action: ${req.action}`)
      }

      // Mark request as APPROVED
      await tx.adminApprovalRequest.update({
        where: { id },
        data: { status: "APPROVED", approvedBy: gate.userId, approvedAt: new Date() },
      })

      // Log the approval action
      await tx.auditLog.create({
        data: {
          userId: gate.userId,
          action: "APPROVE_ADMIN_REQUEST",
          entityType: "AdminApprovalRequest",
          entityId: id,
          changes: { status: "APPROVED", executedAction: req.action },
        },
      })
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Approval execution failed", error)
    return NextResponse.json({ error: error.message || "Execution failed" }, { status: 500 })
  }
}

