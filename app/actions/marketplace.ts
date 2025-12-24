"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function getCommodities(filters?: {
  type?: string
  risk?: string
  status?: string
}) {
  try {
    const where: any = {}

    if (filters?.type && filters.type !== "All") {
      where.type = filters.type
    }

    if (filters?.risk && filters.risk !== "All") {
      where.risk = filters.risk
    }

    if (filters?.status) {
      where.status = filters.status
    } else {
      // Default to showing funding commodities
      where.status = "FUNDING"
    }

    const commodities = await prisma.commodity.findMany({
      where,
      orderBy: { createdAt: "desc" },
    })

    return { success: true, data: commodities }
  } catch (error) {
    console.error("Get commodities error:", error)
    return { error: "Failed to fetch commodities" }
  }
}

export async function getCommodityById(id: string) {
  try {
    const commodity = await prisma.commodity.findUnique({
      where: { id },
      include: {
        documents: {
          where: {
            verified: true,
          },
        },
      },
    })

    if (!commodity) {
      return { error: "Commodity not found" }
    }

    return { success: true, data: commodity }
  } catch (error) {
    console.error("Get commodity error:", error)
    return { error: "Failed to fetch commodity" }
  }
}

