import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { UserManagement } from "@/components/admin/user-management"

export const dynamic = "force-dynamic"

export default async function UsersPage({
}: {
  searchParams?: Record<string, string | string[] | undefined>
}) {
  const session = await auth()
  const isAdminSession = session?.user?.role === "ADMIN"

  // DB-backed role check (keeps role changes effective immediately).
  const dbUser = session?.user?.id
    ? await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } })
    : null
  const isAdmin = (dbUser?.role ?? (isAdminSession ? "ADMIN" : "USER")) === "ADMIN"

  return (
    <UserManagement isAdmin={isAdmin} />
  )
}

