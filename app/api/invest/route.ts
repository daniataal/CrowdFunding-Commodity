import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { investInCommodity } from "@/app/actions/investments"
import { z } from "zod"

const schema = z.object({
  commodityId: z.string().min(1),
  amount: z.number().positive(),
  ackRisk: z.boolean().optional(),
  ackTerms: z.boolean().optional(),
  idempotencyKey: z.string().optional(),
})

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const validated = schema.parse(body)
  const headerKey = request.headers.get("Idempotency-Key") || request.headers.get("X-Idempotency-Key")
  const idempotencyKey = headerKey ?? validated.idempotencyKey
  const forwardedFor = request.headers.get("x-forwarded-for")
  const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : null
  const userAgent = request.headers.get("user-agent")

  const fd = new FormData()
  fd.set("commodityId", validated.commodityId)
  fd.set("amount", String(validated.amount))
  fd.set("ackRisk", String(Boolean(validated.ackRisk)))
  fd.set("ackTerms", String(Boolean(validated.ackTerms)))
  if (idempotencyKey) fd.set("idempotencyKey", idempotencyKey)
  if (ip) fd.set("ipAddress", ip)
  if (userAgent) fd.set("userAgent", userAgent)

  const result = await investInCommodity(fd)
  if ("error" in result) {
    return NextResponse.json(result, { status: result.error === "Unauthorized" ? 401 : 400 })
  }

  return NextResponse.json(result)
}


