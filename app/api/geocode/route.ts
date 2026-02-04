import { NextRequest, NextResponse } from "next/server"
import { geocodePlace } from "@/lib/geocoding"

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("query") ?? ""
  if (!q.trim()) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 })
  }

  const result = await geocodePlace(q)
  if (!result) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return NextResponse.json({ success: true, data: result })
}


