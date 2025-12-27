import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { jwtVerify } from "jose"

function secret() {
  const s = process.env.AUTH_SECRET
  if (!s) throw new Error("AUTH_SECRET is not set")
  return new TextEncoder().encode(s)
}

export async function GET(request: NextRequest, context: { params: Promise<{ docId: string }> }) {
  const { docId } = await context.params
  if (!docId) return NextResponse.json({ error: "Missing docId" }, { status: 400 })

  const token = request.nextUrl.searchParams.get("token")
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 })

  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let payload: any
  try {
    const verified = await jwtVerify(token, secret())
    payload = verified.payload
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 })
  }

  if (payload.sub !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  if (payload.docId !== docId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const doc = await prisma.document.findUnique({ where: { id: docId } })
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // Gatekeeping: only verified docs.
  if (!doc.verified) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // Additional gatekeeping: KYC for normal users already handled upstream, but re-check here as defense-in-depth.
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, kycStatus: true, disabled: true },
  })
  if (!dbUser || (dbUser as any).disabled) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (dbUser.role === "USER" && dbUser.kycStatus !== "APPROVED") {
    return NextResponse.json({ error: "KYC approval required" }, { status: 403 })
  }

  // If this is a commodity doc, ensure user has access to that commodity.
  if (doc.commodityId && dbUser.role === "USER") {
    const invested = await prisma.investment.findFirst({
      where: { userId: session.user.id, commodityId: doc.commodityId },
      select: { id: true },
    })
    if (!invested) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // Minimal "watermarking" placeholder:
  // We don't mutate binary files here; instead we return a secure redirect and include watermark metadata headers.
  const res = NextResponse.redirect(doc.url, 302)
  res.headers.set("X-Watermark", `${session.user.email ?? session.user.id}`)
  return res
}


