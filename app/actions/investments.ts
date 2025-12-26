"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { revalidatePath } from "next/cache"

const investSchema = z.object({
  commodityId: z.string(),
  amount: z.number().positive("Amount must be positive"),
  ackRisk: z.boolean(),
  ackTerms: z.boolean(),
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
      ackRisk: String(formData.get("ackRisk")) === "true",
      ackTerms: String(formData.get("ackTerms")) === "true",
    }

    const validatedData = investSchema.parse(rawData)

    // Get user with current balance
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { walletBalance: true, kycStatus: true },
    })

    if (!user) {
      return { error: "User not found" }
    }

    // Compliance gating
    if (user.kycStatus !== "APPROVED") {
      return { error: "KYC approval is required before investing" }
    }
    if (!validatedData.ackRisk || !validatedData.ackTerms) {
      return { error: "Risk Disclosure and Terms acceptance are required" }
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

    const minInvestment = Number((commodity as any).minInvestment ?? 1000)
    const maxInvestment = (commodity as any).maxInvestment === null ? null : Number((commodity as any).maxInvestment)
    const platformFeeBps = Number((commodity as any).platformFeeBps ?? 150)

    if (validatedData.amount < minInvestment) {
      return { error: `Minimum investment is $${minInvestment.toLocaleString()}` }
    }
    if (maxInvestment !== null && validatedData.amount > maxInvestment) {
      return { error: `Maximum investment is $${maxInvestment.toLocaleString()}` }
    }

    const fee = (Number(validatedData.amount) * platformFeeBps) / 10000
    const totalDebit = Number(validatedData.amount) + fee

    // Check if investment would exceed required amount
    const newCurrentAmount = Number(commodity.currentAmount) + validatedData.amount
    if (newCurrentAmount > Number(commodity.amountRequired)) {
      return { error: "Investment would exceed required funding amount" }
    }

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Deduct from wallet
      if (Number(user.walletBalance) < totalDebit) {
        return { error: "Insufficient balance" } as any
      }

      const updatedUser = await tx.user.update({
        where: { id: session.user.id },
        data: {
          walletBalance: {
            decrement: totalDebit,
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
          amount: -totalDebit, // Negative for outflow (principal + fee)
          status: "COMPLETED",
          description: `Investment in ${commodity.name}`,
          metadata: {
            principal: validatedData.amount,
            fee,
            feeBps: platformFeeBps,
          },
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
            ackRisk: validatedData.ackRisk,
            ackTerms: validatedData.ackTerms,
            minInvestment,
            maxInvestment,
            fee,
            feeBps: platformFeeBps,
          },
        },
      })

      return { investment, updatedCommodity }
    })

    if (result && "error" in (result as any)) {
      return { error: (result as any).error }
    }

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

