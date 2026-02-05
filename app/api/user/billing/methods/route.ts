import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const addCardSchema = z.object({
    number: z.string().min(15).max(19),
    expiry: z.string().regex(/^\d{2}\/\d{2}$/),
    cvc: z.string().min(3).max(4),
    name: z.string().min(3),
})

export async function GET() {
    const session = await auth()
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const methods = await prisma.paymentMethod.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            type: true,
            last4: true,
            brand: true,
            expiry: true,
            isDefault: true,
        },
    })

    return NextResponse.json({ success: true, data: methods })
}

export async function POST(request: NextRequest) {
    const session = await auth()
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validated = addCardSchema.safeParse(body)
    if (!validated.success) {
        return NextResponse.json({ error: "Invalid card details" }, { status: 400 })
    }

    const { number, expiry } = validated.data
    const last4 = number.slice(-4)
    // Mock brand detection
    const brand = number.startsWith("4") ? "visa" : number.startsWith("5") ? "mastercard" : "other"

    // In a real app, you would send this to Stripe/Payment Provider here
    // and store the token, NOT the card details.
    // For this demo, we mock saving a "method" representation.

    const method = await prisma.paymentMethod.create({
        data: {
            userId: session.user.id,
            type: "card",
            last4,
            brand,
            expiry,
            isDefault: false, // logic to handle setting first as default could be added
        },
    })

    return NextResponse.json({ success: true, data: method })
}
