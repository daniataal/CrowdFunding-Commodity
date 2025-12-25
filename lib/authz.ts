import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export type DbRole = "USER" | "ADMIN" | "AUDITOR"

export async function getAuthedUserId() {
  const session = await auth()
  if (!session?.user?.id) return null
  return session.user.id
}

export async function getDbUserRole(userId: string): Promise<DbRole | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  })
  return (user?.role as DbRole | undefined) ?? null
}

export async function requireDbRole(allowed: DbRole[]) {
  const userId = await getAuthedUserId()
  if (!userId) return { ok: false as const, status: 401 as const }

  const role = await getDbUserRole(userId)
  if (!role) return { ok: false as const, status: 401 as const }

  if (!allowed.includes(role)) return { ok: false as const, status: 403 as const }

  return { ok: true as const, userId, role }
}


