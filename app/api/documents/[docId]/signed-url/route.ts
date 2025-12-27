import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { SignJWT } from "jose"

function secret() {
  const s = process.env.AUTH_SECRET
  if (!s) throw new Error("AUTH_SECRET is not set")
  return new TextEncoder().encode(s)
}

export async function GET(request: NextRequest, context: { params: Promise<{ docId: string }> }) {
  const { docId } = await context.params
  if (!docId) return NextResponse.json({ error: "Missing docId" }, { status: 400 })

  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const doc = await prisma.document.findUnique({ where: { id: docId } })
  if (!doc || !doc.verified) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // Gatekeeping mirrors download route so we don't issue tokens to unauthorized users.
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, kycStatus: true, disabled: true },
  })
  if (!dbUser || (dbUser as any).disabled) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (dbUser.role === "USER" && dbUser.kycStatus !== "APPROVED") {
    return NextResponse.json({ error: "KYC approval required" }, { status: 403 })
  }
  if (doc.commodityId && dbUser.role === "USER") {
    const invested = await prisma.investment.findFirst({
      where: { userId: session.user.id, commodityId: doc.commodityId },
      select: { id: true },
    })
    if (!invested) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const token = await new SignJWT({
    docId,
    // minimal watermark metadata
    wm: session.user.email ?? session.user.id,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(session.user.id)
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(secret())

  const url = new URL(`/api/documents/${docId}/download`, request.nextUrl.origin)
  url.searchParams.set("token", token)

  return NextResponse.json({ success: true, data: { url: url.toString(), expiresInSeconds: 600 } })
}


