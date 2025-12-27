import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { toCsv } from "@/lib/csv"

function parseDate(s: string | null) {
  if (!s) return null
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? null : d
}

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const from = parseDate(request.nextUrl.searchParams.get("from"))
  const to = parseDate(request.nextUrl.searchParams.get("to"))

  const defaultFrom = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
  const where: any = { userId: session.user.id }
  where.createdAt = {
    gte: from ?? defaultFrom,
    ...(to ? { lte: to } : {}),
  }

  const txns = await prisma.transaction.findMany({
    where,
    include: { commodity: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" },
    take: 10_000,
  })

  let running = 0
  const rows = txns.map((t) => {
    const amount = Number(t.amount)
    if (t.status === "COMPLETED") running += amount
    return {
      date: t.createdAt.toISOString(),
      type: t.type,
      status: t.status,
      amount,
      runningBalanceCompletedOnly: running,
      description: t.description ?? "",
      commodity: t.commodity?.name ?? "",
      reference: t.reference ?? "",
    }
  })

  const csv = toCsv(rows, [
    "date",
    "type",
    "status",
    "amount",
    "runningBalanceCompletedOnly",
    "description",
    "commodity",
    "reference",
  ])

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="statement-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  })
}


