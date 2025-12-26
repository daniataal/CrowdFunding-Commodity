import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireDbRole } from "@/lib/authz"
import { z } from "zod"

const schema = z.object({
  totalPayout: z.number().positive(),
  markSettled: z.boolean().optional().default(true),
  force: z.boolean().optional().default(false),
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

  // Idempotency guard: if any payouts already exist for this deal, refuse.
  const existingPayout = await prisma.transaction.findFirst({
    where: { commodityId: id, type: "PAYOUT" },
    select: { id: true },
  })
  if (existingPayout) {
    return NextResponse.json({ error: "Payouts already distributed for this deal" }, { status: 400 })
  }

  const commodity = await prisma.commodity.findUnique({ where: { id } })
  if (!commodity) return NextResponse.json({ error: "Deal not found" }, { status: 404 })

  // By default, only allow payouts after ARRIVED (ops-confirmed delivery). Admin can override with force.
  if (!validated.force && commodity.status !== "ARRIVED") {
    return NextResponse.json({ error: "Deal must be ARRIVED before distributing payouts (or use force)" }, { status: 400 })
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

    return {
      investors: payoutByUser.size,
      investments: investments.length,
      totalInvested,
      totalPayout: validated.totalPayout,
    }
  })

  return NextResponse.json({ success: true, data: result })
}


