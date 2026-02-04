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
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 border-r border-border bg-card fixed h-full z-50 transition-all duration-300">
          <div className="flex h-16 items-center border-b border-border px-6 bg-muted/10">
            <Link href="/admin" className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-red-600 to-amber-600 shadow-[0_0_15px_rgba(220,38,38,0.5)]">
                <BarChart3 className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-foreground tracking-wide">{isAdmin ? "Admin Portal" : "Audit Portal"}</span>
            </Link>
          </div>
          <nav className="p-4 space-y-2">
            {[
              { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
              { href: "/admin/deals", icon: Package, label: "Deal Management" },
              { href: "/admin/users", icon: Users, label: "User Management" },
              { href: "/admin/system", icon: BarChart3, label: "System Health" },
            ].map((item) => (
              <Button key={item.href} asChild variant="ghost" className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground hover:bg-muted transition-all mb-1 h-11 rounded-xl">
                <Link href={item.href}>
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              </Button>
            ))}

            <div className="pt-4 border-t border-border mt-4 space-y-2">
              <Button asChild variant="ghost" className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground hover:bg-muted transition-all h-11 rounded-xl">
                <Link href="/">
                  <Settings className="h-4 w-4" />
                  Back to App
                </Link>
              </Button>
              <form
                action={async () => {
                  "use server"
                  await signOut({ redirectTo: "/login" })
                }}
              >
                <Button type="submit" variant="ghost" className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10 transition-all h-11 rounded-xl">
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </form>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 ml-64 min-h-screen bg-background relative">
          {/* Global Background Effects for Admin */}
          <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none -z-10 translate-x-1/2 -translate-y-1/2"></div>

          <div className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
            <div className="px-8 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-foreground tracking-tight">{isAdmin ? "Admin Dashboard" : "Audit Dashboard"}</h1>
                  <p className="text-sm text-muted-foreground">
                    {isAdmin ? "Platform management and oversight" : "Read-only oversight and monitoring"}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="px-4 py-2 rounded-full bg-muted border border-border text-sm text-foreground">
                    {session.user.email}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="p-8 max-w-7xl mx-auto space-y-8">{children}</div>
        </main>
      </div>
    </div>
  )
}

