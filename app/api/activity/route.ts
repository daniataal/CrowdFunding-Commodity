import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const txns = await prisma.transaction.findMany({
    where: { userId: session.user.id },
    include: { commodity: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  const items = txns.map((t) => {
    const base = {
      id: t.id,
      timestamp: t.createdAt.toISOString(),
      amount: Number(t.amount),
    }

    if (t.type === "DEPOSIT") {
      return {
        ...base,
        type: "deposit",
        title: "Account Deposit",
        description: t.description || "Wallet deposit",
        status: t.status === "COMPLETED" ? "success" : t.status === "PENDING" ? "pending" : "info",
      }
    }

    if (t.type === "WITHDRAWAL") {
      return {
        ...base,
        type: "withdrawal",
        title: "Withdrawal",
        description: t.description || "Wallet withdrawal",
        status: t.status === "COMPLETED" ? "success" : t.status === "PENDING" ? "pending" : "info",
      }
    }

    if (t.type === "INVESTMENT") {
      return {
        ...base,
        type: "investment",
        title: "New Investment",
        description: t.commodity?.name ? `Investment in ${t.commodity.name}` : (t.description || "Investment"),
        status: t.status === "COMPLETED" ? "success" : t.status === "PENDING" ? "pending" : "info",
      }
    }

    if (t.type === "DIVIDEND") {
      return {
        ...base,
        type: "dividend",
        title: "Dividend Payment",
        description: t.commodity?.name ? `${t.commodity.name} dividend` : (t.description || "Dividend"),
        status: t.status === "COMPLETED" ? "success" : t.status === "PENDING" ? "pending" : "info",
      }
    }

    return {
      ...base,
      type: "shipment",
      title: "Update",
      description: t.description || "Activity update",
      status: "info",
    }
  })

  return NextResponse.json({ success: true, data: items })
}


