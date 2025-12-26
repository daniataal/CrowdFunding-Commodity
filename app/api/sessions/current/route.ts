import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userAgent = request.headers.get("user-agent") || null
  const forwardedFor = request.headers.get("x-forwarded-for") || null
  const ip = forwardedFor ? forwardedFor.split(",")[0]?.trim() : null

  return NextResponse.json({
    success: true,
    data: {
      userAgent,
      ip,
      active: true,
      lastSeenAt: new Date().toISOString(),
    },
  })
}


