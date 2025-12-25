import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { requireDbRole } from "@/lib/authz"

const createDealSchema = z.object({
  templateKey: z.string().optional(),
  name: z.string().min(1),
  type: z.enum(["Agriculture", "Energy", "Metals"]),
  icon: z
    .enum([
      "coffee",
      "wheat",
      "fuel",
      "boxes",
      "leaf",
      "gold",
      "silver",
      "diesel",
      "titanium",
      "palladium",
      "copper",
    ])
    .optional(),
  risk: z.enum(["Low", "Medium", "High"]),
  targetApy: z.string().transform((val) => Number.parseFloat(val)),
  duration: z.string().transform((val) => Number.parseInt(val)),
  amountRequired: z.string().transform((val) => Number.parseFloat(val)),
  description: z.string().min(1),
  origin: z.string().min(1),
  destination: z.string().min(1),
  shipmentId: z.string().optional(),
  insuranceValue: z.string().optional().transform((val) => val ? Number.parseFloat(val) : null),
  transportMethod: z.string().optional(),
  riskScore: z.string().optional().transform((val) => val ? Number.parseFloat(val) : null),
})

export async function POST(request: NextRequest) {
  try {
    const gate = await requireDbRole(["ADMIN"])
    if (!gate.ok) {
      return NextResponse.json({ error: gate.status === 403 ? "Forbidden" : "Unauthorized" }, { status: gate.status })
    }

    const body = await request.json()
    const validatedData = createDealSchema.parse(body)

    const commodity = await prisma.commodity.create({
      data: {
        name: validatedData.name,
        type: validatedData.type,
        icon: validatedData.icon ?? "boxes",
        risk: validatedData.risk,
        targetApy: validatedData.targetApy,
        duration: validatedData.duration,
        amountRequired: validatedData.amountRequired,
        description: validatedData.description,
        origin: validatedData.origin,
        destination: validatedData.destination,
        shipmentId: validatedData.shipmentId,
        insuranceValue: validatedData.insuranceValue,
        transportMethod: validatedData.transportMethod,
        riskScore: validatedData.riskScore,
        status: "FUNDING",
      },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: gate.userId,
        action: "CREATE_COMMODITY",
        entityType: "Commodity",
        entityId: commodity.id,
        changes: {
          name: commodity.name,
          type: commodity.type,
        },
      },
    })

    return NextResponse.json({ success: true, data: commodity }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error("Create deal error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

