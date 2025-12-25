import { NextResponse } from "next/server"
import { getWalletTransactions } from "@/app/actions/wallet"

export async function GET() {
  const result = await getWalletTransactions()
  if ("error" in result) {
    return NextResponse.json(result, { status: result.error === "Unauthorized" ? 401 : 500 })
  }
  const data = result.data.map((t) => ({
    id: t.id,
    type: t.type,
    amount: Number(t.amount),
    status: t.status,
    description: t.description,
    createdAt: t.createdAt.toISOString(),
    commodity: t.commodity ? { id: t.commodity.id, name: t.commodity.name } : null,
  }))
  return NextResponse.json({ success: true, data })
}


