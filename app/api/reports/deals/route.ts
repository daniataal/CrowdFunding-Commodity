import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(_request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const investments = await prisma.investment.findMany({
    where: { userId: session.user.id },
    include: { commodity: { select: { id: true, name: true, status: true } } },
  })

  // Pull transactions per deal for better breakdown (principal/fees/payouts).
  const txns = await prisma.transaction.findMany({
    where: { userId: session.user.id, commodityId: { not: null } },
    select: { commodityId: true, type: true, amount: true, status: true, metadata: true },
    take: 20_000,
  })

  const byCommodity = new Map<
    string,
    {
      commodityId: string
      commodityName: string
      status: string
      principal: number
      fees: number
      payouts: number
      refunds: number
      netCashflow: number
      investedAmount: number
      projectedReturn: number
      actualReturn: number
    }
  >()

  for (const inv of investments) {
    const id = inv.commodityId
    const cur = byCommodity.get(id) ?? {
      commodityId: id,
      commodityName: inv.commodity?.name ?? "Unknown",
      status: (inv.commodity as any)?.status ?? "UNKNOWN",
      principal: 0,
      fees: 0,
      payouts: 0,
      refunds: 0,
      netCashflow: 0,
      investedAmount: 0,
      projectedReturn: 0,
      actualReturn: 0,
    }
    cur.investedAmount += Number(inv.amount)
    cur.projectedReturn += Number(inv.projectedReturn ?? 0)
    cur.actualReturn += Number(inv.actualReturn ?? 0)
    byCommodity.set(id, cur)
  }

  for (const t of txns) {
    if (!t.commodityId) continue
    const cur =
      byCommodity.get(t.commodityId) ??
      ({
        commodityId: t.commodityId,
        commodityName: "Unknown",
        status: "UNKNOWN",
        principal: 0,
        fees: 0,
        payouts: 0,
        refunds: 0,
        netCashflow: 0,
        investedAmount: 0,
        projectedReturn: 0,
        actualReturn: 0,
      } as any)

    const amount = Number(t.amount)
    if (t.status === "COMPLETED") cur.netCashflow += amount

    if (t.type === "INVESTMENT" && t.status === "COMPLETED") {
      const meta: any = t.metadata ?? {}
      cur.principal += Number(meta.principal ?? 0)
      cur.fees += Number(meta.fee ?? 0)
    }
    if (t.type === "PAYOUT" && t.status === "COMPLETED") cur.payouts += amount
    if (t.type === "REFUND" && t.status === "COMPLETED") cur.refunds += amount

    byCommodity.set(t.commodityId, cur)
  }

  const data = Array.from(byCommodity.values()).sort((a, b) => a.commodityName.localeCompare(b.commodityName))

  return NextResponse.json({ success: true, data })
}


