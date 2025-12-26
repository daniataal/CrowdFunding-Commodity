import NextAuth from "next-auth"
import { authConfig } from "./auth.config"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  // In containerized/local environments you often run with NODE_ENV=production
  // but still use localhost. Auth.js will throw UntrustedHost unless you opt in.
  // Prefer enabling via env var rather than always-on in real production.
  trustHost: process.env.AUTH_TRUST_HOST === "true",
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = loginSchema.safeParse(credentials)

        if (!parsedCredentials.success) {
          return null
        }

        const { email, password } = parsedCredentials.data

        const user = await prisma.user.findUnique({
          where: { email },
        })

        if (!user) {
          return null
        }

        // Soft-disabled users cannot sign in.
        if ((user as any).disabled) {
          return null
        }

        const passwordsMatch = await bcrypt.compare(password, user.passwordHash)

        if (!passwordsMatch) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          kycStatus: user.kycStatus,
          avatar: user.avatar,
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
})

