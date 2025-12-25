import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { withdrawFunds } from "@/app/actions/wallet"
import { z } from "zod"

const schema = z.object({
  amount: z.number().positive(),
  description: z.string().optional(),
})

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const validated = schema.parse(body)

  const fd = new FormData()
  fd.set("amount", String(validated.amount))
  if (validated.description) fd.set("description", validated.description)

  const result = await withdrawFunds(fd)
  if ("error" in result) {
    return NextResponse.json(result, { status: result.error === "Unauthorized" ? 401 : 400 })
  }

  return NextResponse.json(result)
}


