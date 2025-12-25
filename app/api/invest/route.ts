import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { investInCommodity } from "@/app/actions/investments"
import { z } from "zod"

const schema = z.object({
  commodityId: z.string().min(1),
  amount: z.number().positive(),
})

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const validated = schema.parse(body)

  const fd = new FormData()
  fd.set("commodityId", validated.commodityId)
  fd.set("amount", String(validated.amount))

  const result = await investInCommodity(fd)
  if ("error" in result) {
    return NextResponse.json(result, { status: result.error === "Unauthorized" ? 401 : 400 })
  }

  return NextResponse.json(result)
}


