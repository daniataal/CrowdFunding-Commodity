import { UserRole, KycStatus } from "@prisma/client"

declare module "next-auth" {
  interface User {
    id: string
    role: UserRole
    kycStatus: KycStatus
    avatar?: string | null
  }

  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: UserRole
      kycStatus: KycStatus
      avatar?: string | null
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: UserRole
    kycStatus: KycStatus
    avatar?: string | null
  }
}

