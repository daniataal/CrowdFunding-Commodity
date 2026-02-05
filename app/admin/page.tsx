import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Package, DollarSign, TrendingUp, ArrowRight, ShieldCheck, Activity } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function AdminDashboard() {
  const session = await auth()

  if (!session?.user) {
    return null
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  })

  if (!dbUser || (dbUser.role !== "ADMIN" && dbUser.role !== "AUDITOR")) {
    return null
  }

  const isAdmin = dbUser.role === "ADMIN"

  // Get platform statistics
  const [
    totalUsers,
    totalCommodities,
    totalInvestments,
    totalVolume,
    pendingKyc,
    activeDeals,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.commodity.count(),
    prisma.investment.count(),
    prisma.transaction.aggregate({
      where: { type: "INVESTMENT", status: "COMPLETED" },
      _sum: { amount: true },
    }),
    prisma.user.count({ where: { kycStatus: "PENDING" } }),
    prisma.commodity.count({ where: { status: { in: ["FUNDING", "ACTIVE", "IN_TRANSIT"] } } }),
  ])

  const stats = [
    {
      title: "Total Volume",
      value: `$${(Math.abs(Number(totalVolume._sum.amount ?? 0)) / 1000).toFixed(0)}k`,
      description: "Total capital deployed",
      icon: DollarSign,
      color: "text-accent",
      bg: "bg-accent/10",
      border: "border-accent/20",
    },
    {
      title: "Active Deals",
      value: activeDeals,
      description: "Currently live on market",
      icon: Package,
      color: "text-primary",
      bg: "bg-primary/10",
      border: "border-primary/20",
    },
    {
      title: "Total Investments",
      value: totalInvestments,
      description: "Successful transactions",
      icon: TrendingUp,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    {
      title: "Total Users",
      value: totalUsers,
      description: `${pendingKyc} pending KYC review`,
      icon: Users,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">Platform overview and management controls</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className={`border bg-card p-6 relative overflow-hidden group hover:shadow-lg transition-all duration-300 ${stat.border}`}>
              <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-[60px] opacity-20 -mr-10 -mt-10 transition-all group-hover:opacity-40 ${stat.bg.replace('/10', '/30')}`} />

              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0 mb-4 relative z-10">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{stat.title}</CardTitle>
                <div className={`p-2.5 rounded-xl ${stat.bg}`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent className="p-0 relative z-10">
                <div className={`text-4xl font-bold ${stat.color} mb-1`}>{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-border bg-card rounded-2xl relative overflow-hidden shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-foreground">System Activity</CardTitle>
              <CardDescription className="text-muted-foreground">Recent platform events and logs</CardDescription>
            </div>
            <Activity className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-border/50 rounded-xl bg-muted/5">
                <div className="h-12 w-12 rounded-full bg-muted/10 flex items-center justify-center mb-4">
                  <Activity className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-foreground">Activity Feed</h3>
                <p className="text-sm text-muted-foreground max-w-sm mt-2">
                  Real-time system logging and activity tracking is being configured. Check back soon for updates.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card rounded-2xl relative overflow-hidden shadow-sm">
          <CardHeader>
            <CardTitle className="text-foreground">Quick Actions</CardTitle>
            <CardDescription className="text-muted-foreground">Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isAdmin && (
              <Link href="/admin/deals/new" className="block group">
                <div className="p-4 rounded-xl border border-border bg-muted/5 hover:bg-primary/5 hover:border-primary/20 transition-all cursor-pointer flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-foreground group-hover:text-primary transition-colors">New Deal</div>
                    <p className="text-xs text-muted-foreground">Create commodity listing</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </Link>
            )}

            <Link href="/admin/users" className="block group">
              <div className="p-4 rounded-xl border border-border bg-muted/5 hover:bg-accent/5 hover:border-accent/20 transition-all cursor-pointer flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                  <ShieldCheck className="h-5 w-5 text-accent" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="font-semibold text-foreground group-hover:text-accent transition-colors">KYC Reviews</div>
                    {pendingKyc > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-accent text-[10px] font-bold text-black leading-none">
                        {pendingKyc}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">Process user verifications</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-accent transition-colors" />
              </div>
            </Link>

            <Link href="/admin/system" className="block group">
              <div className="p-4 rounded-xl border border-border bg-muted/5 hover:bg-blue-500/5 hover:border-blue-500/20 transition-all cursor-pointer flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                  <Activity className="h-5 w-5 text-blue-500" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-foreground group-hover:text-blue-500 transition-colors">System Health</div>
                  <p className="text-xs text-muted-foreground">View platform status</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-blue-500 transition-colors" />
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
