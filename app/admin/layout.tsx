import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { LayoutDashboard, Package, Users, BarChart3, Settings, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { signOut } from "@/auth"
import { prisma } from "@/lib/prisma"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  })

  if (!dbUser || (dbUser.role !== "ADMIN" && dbUser.role !== "AUDITOR")) {
    redirect("/")
  }

  const isAdmin = dbUser.role === "ADMIN"

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 border-r border-border bg-card/50 backdrop-blur">
          <div className="flex h-16 items-center border-b border-border px-6">
            <Link href="/admin" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold">{isAdmin ? "Admin Portal" : "Audit Portal"}</span>
            </Link>
          </div>
          <nav className="p-4 space-y-2">
            <Link href="/admin">
              <Button variant="ghost" className="w-full justify-start gap-2">
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Button>
            </Link>
            <Link href="/admin/deals">
              <Button variant="ghost" className="w-full justify-start gap-2">
                <Package className="h-4 w-4" />
                Deal Management
              </Button>
            </Link>
            <Link href="/admin/users">
              <Button variant="ghost" className="w-full justify-start gap-2">
                <Users className="h-4 w-4" />
                User Management
              </Button>
            </Link>
            <Link href="/admin/system">
              <Button variant="ghost" className="w-full justify-start gap-2">
                <BarChart3 className="h-4 w-4" />
                System Health
              </Button>
            </Link>
            <div className="pt-4 border-t border-border">
              <Link href="/">
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <Settings className="h-4 w-4" />
                  Back to App
                </Button>
              </Link>
              <form
                action={async () => {
                  "use server"
                  await signOut({ redirectTo: "/login" })
                }}
              >
                <Button type="submit" variant="ghost" className="w-full justify-start gap-2 text-red-500">
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </form>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          <div className="border-b border-border bg-card/50 backdrop-blur">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold">{isAdmin ? "Admin Dashboard" : "Audit Dashboard"}</h1>
                  <p className="text-sm text-muted-foreground">
                    {isAdmin ? "Platform management and oversight" : "Read-only oversight and monitoring"}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">{session.user.email}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  )
}

