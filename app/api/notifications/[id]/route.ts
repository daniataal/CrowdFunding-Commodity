import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await context.params
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  const existing = await prisma.notification.findUnique({
    where: { id },
    select: { userId: true },
  })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (existing.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await request.json().catch(() => ({}))
  const read = typeof body?.read === "boolean" ? body.read : true

  const updated = await prisma.notification.update({
    where: { id },
    data: { read },
  })

  return NextResponse.json({
    success: true,
    data: {
      id: updated.id,
      type: updated.type,
      title: updated.title,
      message: updated.message,
      timestamp: updated.createdAt.toISOString(),
      read: updated.read,
      icon: updated.icon,
      link: updated.link,
    },
  })
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await context.params
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  const existing = await prisma.notification.findUnique({
    where: { id },
    select: { userId: true },
  })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (existing.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  await prisma.notification.delete({ where: { id } })
  return NextResponse.json({ success: true })
}


