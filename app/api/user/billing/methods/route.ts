import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const addCardSchema = z.object({
    number: z.string().min(13).max(19), // Simple length check
    expiry: z.string().regex(/^\d{2}\/\d{2}$/, "Invalid expiry format (MM/YY)"),
    cvc: z.string().min(3).max(4),
    name: z.string().min(1),
})

export async function GET() {
    const session = await auth()
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const methods = await prisma.paymentMethod.findMany({
        where: { userId: session.user.id },
        select: {
            id: true,
            type: true,
            last4: true,
            brand: true,
            expiry: true,
            isDefault: true,
        },
        orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ success: true, data: methods })
}

export async function POST(request: NextRequest) {
    const session = await auth()
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const body = await request.json()
        const validated = addCardSchema.parse(body)

        // In a real app, you would send this to Stripe/Provider here.
        // We will simulate a successful add by storing a "PaymentMethod" record.
        // We only store non-sensitive info + last 4.

        const last4 = validated.number.slice(-4)
        // Mock brand detection
        const brand = validated.number.startsWith("4") ? "visa" : "mastercard"

        const method = await prisma.paymentMethod.create({
            data: {
                userId: session.user.id,
                type: "card",
                last4,
                brand,
                expiry: validated.expiry,
                isDefault: false, // Could logically make it default if it's the first one
            },
        })

        return NextResponse.json({ success: true, data: method })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
        }
        return NextResponse.json({ error: "Failed to add payment method" }, { status: 500 })
    }
}
