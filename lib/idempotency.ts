import "server-only"

import crypto from "node:crypto"
import { prisma } from "@/lib/prisma"

export function sha256Base64Url(input: string) {
  return crypto.createHash("sha256").update(input).digest("base64url")
}

export type IdempotencyScope = string

export async function runIdempotent<T>(args: {
  userId: string
  scope: IdempotencyScope
  key: string
  requestHash: string
  run: (tx: Parameters<typeof prisma.$transaction>[0] extends (tx: infer U) => any ? U : never) => Promise<T>
  response: (value: T) => any
}): Promise<{ ok: true; value: T } | { ok: false; error: string; status: number; value?: any }> {
  try {
    const out = await prisma.$transaction(async (tx: any) => {
      const existing = await tx.idempotencyKey.findUnique({
        where: { userId_scope_key: { userId: args.userId, scope: args.scope, key: args.key } },
      })

      if (existing) {
        if (existing.requestHash && existing.requestHash !== args.requestHash) {
          return { kind: "error", status: 409, error: "Idempotency key reuse with different request" } as const
        }
        if (existing.status === "COMPLETED") {
          return { kind: "return", value: existing.responseJson } as const
        }
        if (existing.status === "IN_PROGRESS") {
          return { kind: "error", status: 409, error: "Request already in progress" } as const
        }
      }

      await tx.idempotencyKey.upsert({
        where: { userId_scope_key: { userId: args.userId, scope: args.scope, key: args.key } },
        create: {
          userId: args.userId,
          scope: args.scope,
          key: args.key,
          requestHash: args.requestHash,
          status: "IN_PROGRESS",
        },
        update: {
          requestHash: args.requestHash,
          status: "IN_PROGRESS",
          error: null,
        },
      })

      const value = await args.run(tx)
      const responseJson = args.response(value)

      await tx.idempotencyKey.update({
        where: { userId_scope_key: { userId: args.userId, scope: args.scope, key: args.key } },
        data: { status: "COMPLETED", responseJson, error: null },
      })

      return { kind: "ok", value } as const
    })

    if (out.kind === "return") return { ok: true, value: out.value as any }
    if (out.kind === "error") return { ok: false, error: out.error, status: out.status }
    return { ok: true, value: out.value }
  } catch (e) {
    return { ok: false, error: (e as Error).message, status: 500 }
  }
}


