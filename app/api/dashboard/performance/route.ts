import { NextResponse } from "next/server"
import { getPerformanceData } from "@/app/actions/dashboard"

export async function GET() {
  const result = await getPerformanceData()
  if ("error" in result) {
    return NextResponse.json(result, { status: result.error === "Unauthorized" ? 401 : 500 })
  }
  return NextResponse.json(result)
}


