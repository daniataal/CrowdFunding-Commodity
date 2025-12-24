"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function getPortfolioSummary() {
  try {
    const session = await auth()
    if (!session?.user) {
      return { error: "Unauthorized" }
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { walletBalance: true },
    })

    if (!user) {
      return { error: "User not found" }
    }

    // Get all active investments
    const investments = await prisma.investment.findMany({
      where: {
        userId: session.user.id,
        status: "ACTIVE",
      },
      include: {
        commodity: {
          select: {
            id: true,
            name: true,
            status: true,
            targetApy: true,
            duration: true,
            currentAmount: true,
            amountRequired: true,
            maturityDate: true,
          },
        },
      },
    })

    // Calculate total invested
    const totalInvested = investments.reduce((sum, inv) => sum + Number(inv.amount), 0)

    // Calculate total portfolio value (investments + projected returns)
    let totalPortfolioValue = totalInvested
    let totalProfit = 0

    for (const investment of investments) {
      const commodity = investment.commodity
      
      // If commodity is settled, use actual return
      if (commodity.status === "SETTLED" && investment.actualReturn) {
        totalProfit += Number(investment.actualReturn)
        totalPortfolioValue += Number(investment.amount) + Number(investment.actualReturn)
      } else if (investment.projectedReturn) {
        // Use projected return for active investments
        totalProfit += Number(investment.projectedReturn)
        totalPortfolioValue += Number(investment.amount) + Number(investment.projectedReturn)
      } else {
        // Calculate projected return if not set
        const projectedReturn =
          Number(investment.amount) *
          (Number(commodity.targetApy) / 100) *
          (commodity.duration / 365)
        totalProfit += projectedReturn
        totalPortfolioValue += Number(investment.amount) + projectedReturn
      }
    }

    // Calculate ROI
    const roi = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0

    return {
      success: true,
      data: {
        totalValue: totalPortfolioValue,
        totalProfit,
        cashInWallet: Number(user.walletBalance),
        roi,
        totalInvested,
      },
    }
  } catch (error) {
    console.error("Get portfolio summary error:", error)
    return { error: "Failed to fetch portfolio summary" }
  }
}

export async function getActiveShipments() {
  try {
    const session = await auth()
    if (!session?.user) {
      return { error: "Unauthorized" }
    }

    // Get commodities where user has investments and status is IN_TRANSIT or ACTIVE
    const investments = await prisma.investment.findMany({
      where: {
        userId: session.user.id,
        status: "ACTIVE",
      },
      include: {
        commodity: {
          where: {
            status: {
              in: ["ACTIVE", "IN_TRANSIT"],
            },
          },
        },
      },
    })

    const activeShipments = investments
      .map((inv) => inv.commodity)
      .filter((c) => c !== null)

    return { success: true, data: activeShipments }
  } catch (error) {
    console.error("Get active shipments error:", error)
    return { error: "Failed to fetch active shipments" }
  }
}

export async function getPerformanceData() {
  try {
    const session = await auth()
    if (!session?.user) {
      return { error: "Unauthorized" }
    }

    // Get historical portfolio values (simplified - in production, store historical snapshots)
    // For now, we'll calculate current value and create a mock historical trend
    const summary = await getPortfolioSummary()
    
    if (!summary.success || "error" in summary) {
      return { error: "Failed to calculate performance" }
    }

    // Generate mock historical data based on current value
    // In production, you'd store daily snapshots
    const currentValue = summary.data.totalValue
    const months = 6
    const data = []

    for (let i = months; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      
      // Simulate growth (simplified)
      const growthFactor = 1 + (months - i) * 0.03
      const portfolioValue = currentValue / growthFactor
      const marketValue = portfolioValue * 0.95 // Market slightly underperforms

      data.push({
        date: monthKey,
        portfolio: Math.round(portfolioValue),
        market: Math.round(marketValue),
      })
    }

    return { success: true, data }
  } catch (error) {
    console.error("Get performance data error:", error)
    return { error: "Failed to fetch performance data" }
  }
}

