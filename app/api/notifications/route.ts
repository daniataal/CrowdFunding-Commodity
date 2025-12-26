import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  const data = notifications.map((n) => ({
    id: n.id,
    type: n.type as any,
    title: n.title,
    message: n.message,
    timestamp: n.createdAt.toISOString(),
    read: n.read,
    icon: n.icon,
    link: n.link,
  }))

  return NextResponse.json({ success: true, data })
}

export async function PATCH(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: any = null
  try {
    body = await request.json()
  } catch {
    body = null
  }

  if (!body?.markAllRead) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  await prisma.notification.updateMany({
    where: { userId: session.user.id, read: false },
    data: { read: true },
  })

  return NextResponse.json({ success: true })
}


