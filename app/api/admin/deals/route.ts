import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createDealSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["Agriculture", "Energy", "Metals"]),
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
    const session = await auth()

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createDealSchema.parse(body)

    const commodity = await prisma.commodity.create({
      data: {
        name: validatedData.name,
        type: validatedData.type,
        icon: "boxes", // Default icon, can be enhanced later
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
        userId: session.user.id,
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

