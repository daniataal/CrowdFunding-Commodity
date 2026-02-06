import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
// @ts-ignore
import { authenticator } from "otplib"
import { z } from "zod"

const verifySchema = z.object({
    token: z.string().length(6),
    secret: z.string().min(1),
})

export async function POST(request: NextRequest) {
    const session = await auth()
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const result = verifySchema.safeParse(body)

    if (!result.success) {
        return NextResponse.json({ error: "Invalid input" }, { status: 400 })
    }

    const { token, secret } = result.data

    // Verify the token
    try {
        const isValid = authenticator.check(token, secret)
        if (!isValid) {
            return NextResponse.json({ error: "Invalid code" }, { status: 400 })
        }

        // Save to DB
        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                twoFactorEnabled: true,
                twoFactorSecret: secret,
            },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: "Verification failed" }, { status: 500 })
    }
}
