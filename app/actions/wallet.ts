"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { revalidatePath } from "next/cache"

const depositSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  reference: z.string().optional(),
})

const withdrawalSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  description: z.string().optional(),
})

export async function depositFunds(formData: FormData) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { error: "Unauthorized" }
    }

    const rawData = {
      amount: Number.parseFloat(formData.get("amount") as string),
      reference: formData.get("reference") as string | undefined,
    }

    const validatedData = depositSchema.parse(rawData)

    // Block wallet operations when frozen.
    const walletState = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { walletFrozen: true },
    })
    if ((walletState as any)?.walletFrozen) {
      return { error: "Wallet is frozen. Please contact support." }
    }

    // In production, verify payment with payment gateway (Stripe, etc.)
    // For now, we'll create a pending transaction that needs admin approval

    const result = await prisma.$transaction(async (tx) => {
      // Create pending transaction
      const transaction = await tx.transaction.create({
        data: {
          userId: session.user.id,
          type: "DEPOSIT",
          amount: validatedData.amount,
          status: "PENDING", // In production, this would be COMPLETED after payment verification
          description: "Wallet deposit",
          reference: validatedData.reference,
        },
      })

      // For demo purposes, we'll auto-approve deposits
      // In production, this would happen after payment gateway confirmation
      const updatedUser = await tx.user.update({
        where: { id: session.user.id },
        data: {
          walletBalance: {
            increment: validatedData.amount,
          },
        },
      })

      await tx.transaction.update({
        where: { id: transaction.id },
        data: { status: "COMPLETED" },
      })

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: "DEPOSIT_FUNDS",
          entityType: "Transaction",
          entityId: transaction.id,
          changes: {
            amount: validatedData.amount,
          },
        },
      })

      return { transaction, updatedUser }
    })

    revalidatePath("/wallet")
    revalidatePath("/")

    return { success: true, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message }
    }
    console.error("Deposit error:", error)
    return { error: "Failed to process deposit" }
  }
}

export async function withdrawFunds(formData: FormData) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { error: "Unauthorized" }
    }

    const rawData = {
      amount: Number.parseFloat(formData.get("amount") as string),
      description: formData.get("description") as string | undefined,
    }

    const validatedData = withdrawalSchema.parse(rawData)

    // Get user with current balance
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { walletBalance: true, walletFrozen: true },
    })

    if (!user) {
      return { error: "User not found" }
    }

    if ((user as any).walletFrozen) {
      return { error: "Wallet is frozen. Please contact support." }
    }

    // Check if user has sufficient balance
    if (Number(user.walletBalance) < validatedData.amount) {
      return { error: "Insufficient balance" }
    }

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

      // Create withdrawal transaction (pending until processed)
      const transaction = await tx.transaction.create({
        data: {
          userId: session.user.id,
          type: "WITHDRAWAL",
          amount: -validatedData.amount,
          status: "PENDING", // Admin needs to process withdrawal
          description: validatedData.description || "Withdrawal request",
        },
      })

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: "WITHDRAW_FUNDS",
          entityType: "Transaction",
          entityId: transaction.id,
          changes: {
            amount: validatedData.amount,
          },
        },
      })

      return { transaction, updatedUser }
    })

    revalidatePath("/wallet")
    revalidatePath("/")

    return { success: true, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message }
    }
    console.error("Withdrawal error:", error)
    return { error: "Failed to process withdrawal" }
  }
}

export async function getWalletTransactions() {
  try {
    const session = await auth()
    if (!session?.user) {
      return { error: "Unauthorized" }
    }

    const transactions = await prisma.transaction.findMany({
      where: { userId: session.user.id },
      include: {
        commodity: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    })

    return { success: true, data: transactions }
  } catch (error) {
    console.error("Get transactions error:", error)
    return { error: "Failed to fetch transactions" }
  }
}

export async function getWalletBalance() {
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

    return { success: true, data: { balance: user.walletBalance } }
  } catch (error) {
    console.error("Get balance error:", error)
    return { error: "Failed to fetch balance" }
  }
}

