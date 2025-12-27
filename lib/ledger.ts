import "server-only"

import { Prisma } from "@prisma/client"

type Tx = {
  ledgerAccount: {
    upsert: Function
  }
  ledgerEntry: {
    create: Function
  }
}

export type LedgerLineInput = {
  accountId: string
  debit: Prisma.Decimal
  credit: Prisma.Decimal
}

function keySys(name: string) {
  return `sys:${name}`
}
function keyUser(userId: string, name: string) {
  return `user:${userId}:${name}`
}
function keyCommodity(commodityId: string, name: string) {
  return `com:${commodityId}:${name}`
}

async function getOrCreateSystemAccount(tx: any, args: { name: string; type: any; currency?: string }) {
  const currency = args.currency ?? "USD"
  return tx.ledgerAccount.upsert({
    where: { key: keySys(args.name) },
    create: { key: keySys(args.name), name: args.name, type: args.type, currency },
    update: {},
  })
}

export async function getOrCreateUserWalletAccount(tx: any, userId: string) {
  return tx.ledgerAccount.upsert({
    where: { key: keyUser(userId, "wallet") },
    create: {
      key: keyUser(userId, "wallet"),
      name: "Wallet",
      type: "LIABILITY",
      currency: "USD",
      userId,
    },
    update: {},
  })
}

export async function getOrCreateCommodityEscrowAccount(tx: any, commodityId: string) {
  return tx.ledgerAccount.upsert({
    where: { key: keyCommodity(commodityId, "escrow") },
    create: {
      key: keyCommodity(commodityId, "escrow"),
      name: "Escrow",
      type: "LIABILITY",
      currency: "USD",
      commodityId,
    },
    update: {},
  })
}

export async function getOrCreatePlatformCashAccount(tx: any) {
  return getOrCreateSystemAccount(tx, { name: "Platform Cash", type: "ASSET", currency: "USD" })
}

export async function getOrCreatePlatformFeeIncomeAccount(tx: any) {
  return getOrCreateSystemAccount(tx, { name: "Platform Fee Income", type: "INCOME", currency: "USD" })
}

export async function getOrCreatePayoutExpenseAccount(tx: any) {
  return getOrCreateSystemAccount(tx, { name: "Payout Expense", type: "EXPENSE", currency: "USD" })
}

export async function getOrCreateAdminAdjustmentAccount(tx: any) {
  return getOrCreateSystemAccount(tx, { name: "Admin Adjustments", type: "EXPENSE", currency: "USD" })
}

function sumDecimal(values: Prisma.Decimal[]) {
  return values.reduce((acc, v) => acc.add(v), new Prisma.Decimal(0))
}

export async function createBalancedLedgerEntry(
  tx: any,
  args: {
    type: any
    description: string
    currency?: string
    userId?: string | null
    commodityId?: string | null
    transactionId?: string | null
    metadata?: any
    lines: Array<{ accountId: string; debit?: number; credit?: number }>
  }
) {
  const currency = args.currency ?? "USD"
  const lines: LedgerLineInput[] = args.lines.map((l) => ({
    accountId: l.accountId,
    debit: new Prisma.Decimal(l.debit ?? 0),
    credit: new Prisma.Decimal(l.credit ?? 0),
  }))

  const debitTotal = sumDecimal(lines.map((l) => l.debit))
  const creditTotal = sumDecimal(lines.map((l) => l.credit))
  if (!debitTotal.equals(creditTotal)) {
    throw new Error(`Unbalanced ledger entry: debit=${debitTotal.toFixed(2)} credit=${creditTotal.toFixed(2)}`)
  }

  return tx.ledgerEntry.create({
    data: {
      type: args.type,
      currency,
      description: args.description,
      userId: args.userId ?? null,
      commodityId: args.commodityId ?? null,
      transactionId: args.transactionId ?? null,
      metadata: args.metadata ?? undefined,
      lines: {
        create: lines.map((l) => ({ accountId: l.accountId, debit: l.debit, credit: l.credit })),
      },
    },
  })
}


