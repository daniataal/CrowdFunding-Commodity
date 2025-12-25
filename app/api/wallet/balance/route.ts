import { NextResponse } from "next/server"
import { getWalletBalance } from "@/app/actions/wallet"

export async function GET() {
  const result = await getWalletBalance()
  if ("error" in result) {
    return NextResponse.json(result, { status: result.error === "Unauthorized" ? 401 : 500 })
  }
  return NextResponse.json({
    success: true,
    data: { balance: Number(result.data.balance) },
  })
}


