"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { revalidatePath } from "next/cache"
import {
  createBalancedLedgerEntry,
  getOrCreatePlatformCashAccount,
  getOrCreateUserWalletAccount,
} from "@/lib/ledger"
import { runIdempotent, sha256Base64Url } from "@/lib/idempotency"
import { RISK_LIMITS } from "@/lib/risk-limits"

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

    const rawValues = {
      amount: formData.get("amount"),
      reference: formData.get("reference"),
    }

    const rawData = {
      amount: Number.parseFloat(rawValues.amount as string),
      reference: (rawValues.reference as string) || undefined,
    }

    const validatedData = depositSchema.parse(rawData)

    // Automatically generate reference if missing (for bank transfer matching)
    if (!validatedData.reference) {
      validatedData.reference = `DEP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
    }

    const idempotencyKey = (formData.get("idempotencyKey") as string | null) ?? null

    if (validatedData.amount > RISK_LIMITS.maxDepositPerTxn) {
      return { error: `Deposit exceeds max per transaction ($${RISK_LIMITS.maxDepositPerTxn.toLocaleString()}).` }
    }

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

    const exec = async (tx: any) => {
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

      const [cash, wallet] = await Promise.all([
        getOrCreatePlatformCashAccount(tx),
        getOrCreateUserWalletAccount(tx, session.user.id),
      ])

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

      await createBalancedLedgerEntry(tx, {
        type: "DEPOSIT",
        description: "Wallet deposit",
        userId: session.user.id,
        transactionId: transaction.id,
        lines: [
          { accountId: cash.id, debit: validatedData.amount },
          { accountId: wallet.id, credit: validatedData.amount },
        ],
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
    }

    const result = idempotencyKey
      ? await runIdempotent({
        userId: session.user.id,
        scope: "wallet:deposit",
        key: idempotencyKey,
        requestHash: sha256Base64Url(JSON.stringify({ amount: validatedData.amount, reference: validatedData.reference ?? null })),
        run: exec,
        response: (v) => ({
          transactionId: v.transaction.id,
          status: v.transaction.status,
          newBalance: Number(v.updatedUser.walletBalance),
        }),
      })
      : { ok: true as const, value: await prisma.$transaction(exec) }

    if (!result.ok) {
      return { error: result.error }
    }

    revalidatePath("/wallet")
    revalidatePath("/")

    return { success: true, data: result.value }
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

    const rawValues = {
      amount: formData.get("amount"),
      description: formData.get("description"),
    }

    const rawData = {
      amount: Number.parseFloat(rawValues.amount as string),
      description: (rawValues.description as string) || undefined,
    }

    const validatedData = withdrawalSchema.parse(rawData)
    const idempotencyKey = (formData.get("idempotencyKey") as string | null) ?? null

    if (validatedData.amount > RISK_LIMITS.maxWithdrawPerTxn) {
      return { error: `Withdrawal exceeds max per transaction ($${RISK_LIMITS.maxWithdrawPerTxn.toLocaleString()}).` }
    }

    // Daily withdrawal limit (24h rolling window)
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const agg = await prisma.transaction.aggregate({
      where: { userId: session.user.id, type: "WITHDRAWAL", createdAt: { gte: since } },
      _sum: { amount: true },
    })
    const totalLast24h = Math.abs(Number(agg._sum.amount ?? 0))
    if (totalLast24h + validatedData.amount > RISK_LIMITS.maxWithdrawPerDay) {
      return { error: `Daily withdrawal limit exceeded ($${RISK_LIMITS.maxWithdrawPerDay.toLocaleString()}).` }
    }

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

    const exec = async (tx: any) => {
      const [cash, wallet] = await Promise.all([
        getOrCreatePlatformCashAccount(tx),
        getOrCreateUserWalletAccount(tx, session.user.id),
      ])

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

      await createBalancedLedgerEntry(tx, {
        type: "WITHDRAWAL",
        description: transaction.description ?? "Withdrawal request",
        userId: session.user.id,
        transactionId: transaction.id,
        lines: [
          { accountId: wallet.id, debit: validatedData.amount },
          { accountId: cash.id, credit: validatedData.amount },
        ],
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
    }

    const result = idempotencyKey
      ? await runIdempotent({
        userId: session.user.id,
        scope: "wallet:withdraw",
        key: idempotencyKey,
        requestHash: sha256Base64Url(
          JSON.stringify({ amount: validatedData.amount, description: validatedData.description ?? null })
        ),
        run: exec,
        response: (v) => ({
          transactionId: v.transaction.id,
          status: v.transaction.status,
          newBalance: Number(v.updatedUser.walletBalance),
        }),
      })
      : { ok: true as const, value: await prisma.$transaction(exec) }

    if (!result.ok) {
      return { error: result.error }
    }

    revalidatePath("/wallet")
    revalidatePath("/")

    return { success: true, data: result.value }
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

