import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = forgotPasswordSchema.parse(body)

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
    })

    // Always return success to prevent email enumeration
    // In production, send email with reset token here
    // For now, we'll just log it
    if (user) {
      // TODO: Generate reset token and send email
      console.log(`Password reset requested for: ${validatedData.email}`)
    }

    return NextResponse.json({ message: "If an account exists, a reset link has been sent" }, { status: 200 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }

    console.error("Forgot password error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

