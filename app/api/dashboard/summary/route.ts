import { NextResponse } from "next/server"
import { getPortfolioSummary } from "@/app/actions/dashboard"

export async function GET() {
  const result = await getPortfolioSummary()
  if ("error" in result) {
    return NextResponse.json(result, { status: result.error === "Unauthorized" ? 401 : 500 })
  }
  return NextResponse.json(result)
}


