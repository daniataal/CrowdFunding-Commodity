"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { revalidatePath } from "next/cache"

const investSchema = z.object({
  commodityId: z.string(),
  amount: z.number().positive("Amount must be positive"),
})

export async function investInCommodity(formData: FormData) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { error: "Unauthorized" }
    }

    const rawData = {
      commodityId: formData.get("commodityId") as string,
      amount: Number.parseFloat(formData.get("amount") as string),
    }

    const validatedData = investSchema.parse(rawData)

    // Get user with current balance
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { walletBalance: true },
    })

    if (!user) {
      return { error: "User not found" }
    }

    // Check if user has sufficient balance
    if (Number(user.walletBalance) < validatedData.amount) {
      return { error: "Insufficient balance" }
    }

    // Get commodity
    const commodity = await prisma.commodity.findUnique({
      where: { id: validatedData.commodityId },
    })

    if (!commodity) {
      return { error: "Commodity not found" }
    }

    if (commodity.status !== "FUNDING") {
      return { error: "Commodity is not accepting investments" }
    }

    // Check if investment would exceed required amount
    const newCurrentAmount = Number(commodity.currentAmount) + validatedData.amount
    if (newCurrentAmount > Number(commodity.amountRequired)) {
      return { error: "Investment would exceed required funding amount" }
    }

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Deduct from wallet
      const updatedUser = await tx.user.update({
        where: { id: session.user.id },
        data: {
          walletBalance: {
            decrement: validatedData.amount,
          },
        },
      })

      // Update commodity funding
      const updatedCommodity = await tx.commodity.update({
        where: { id: validatedData.commodityId },
        data: {
          currentAmount: {
            increment: validatedData.amount,
          },
          // Update status if fully funded
          status:
            newCurrentAmount >= Number(commodity.amountRequired) ? "ACTIVE" : commodity.status,
        },
      })

      // Calculate ownership percentage
      const percentage = Number(validatedData.amount) / Number(commodity.amountRequired)

      // Calculate projected return
      const projectedReturn =
        Number(validatedData.amount) *
        (Number(commodity.targetApy) / 100) *
        (commodity.duration / 365)

      // Create investment record
      const investment = await tx.investment.create({
        data: {
          userId: session.user.id,
          commodityId: validatedData.commodityId,
          amount: validatedData.amount,
          percentage,
          projectedReturn,
        },
      })

      // Create transaction record
      await tx.transaction.create({
        data: {
          userId: session.user.id,
          commodityId: validatedData.commodityId,
          type: "INVESTMENT",
          amount: -validatedData.amount, // Negative for outflow
          status: "COMPLETED",
          description: `Investment in ${commodity.name}`,
        },
      })

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: "CREATE_INVESTMENT",
          entityType: "Investment",
          entityId: investment.id,
          changes: {
            commodityId: validatedData.commodityId,
            amount: validatedData.amount,
          },
        },
      })

      return { investment, updatedCommodity }
    })

    revalidatePath("/")
    revalidatePath("/marketplace")
    revalidatePath("/wallet")

    return { success: true, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message }
    }
    console.error("Investment error:", error)
    return { error: "Failed to process investment" }
  }
}

export async function getUserInvestments() {
  try {
    const session = await auth()
    if (!session?.user) {
      return { error: "Unauthorized" }
    }

    const investments = await prisma.investment.findMany({
      where: { userId: session.user.id },
      include: {
        commodity: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return { success: true, data: investments }
  } catch (error) {
    console.error("Get investments error:", error)
    return { error: "Failed to fetch investments" }
  }
}

