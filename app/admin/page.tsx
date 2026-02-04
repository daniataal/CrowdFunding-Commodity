import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Package, DollarSign, TrendingUp } from "lucide-react"

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
      title: "Total Users",
      value: totalUsers,
      description: `${pendingKyc} pending KYC`,
      icon: Users,
      color: "text-blue-500",
    },
    {
      title: "Active Deals",
      value: activeDeals,
      description: "Currently funding or active",
      icon: Package,
      color: "text-emerald-500",
    },
    {
      title: "Total Investments",
      value: totalInvestments,
      description: "All time",
      icon: TrendingUp,
      color: "text-amber-500",
    },
    {
      title: "Platform Volume",
      value: `$${(Math.abs(Number(totalVolume._sum.amount ?? 0)) / 1000).toFixed(0)}k`,
      description: "Total investment volume",
      icon: DollarSign,
      color: "text-purple-500",
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
          // Map colors to tailwind classes safely if needed, or use inline styles for dynamic bg
          let bgGlow = "bg-primary/5"
          let iconColor = "text-primary"

          if (stat.color.includes("blue")) { bgGlow = "bg-blue-500/10"; iconColor = "text-blue-500"; }
          if (stat.color.includes("emerald")) { bgGlow = "bg-emerald-500/10"; iconColor = "text-emerald-500"; }
          if (stat.color.includes("amber")) { bgGlow = "bg-amber-500/10"; iconColor = "text-amber-500"; }
          if (stat.color.includes("purple")) { bgGlow = "bg-purple-500/10"; iconColor = "text-purple-500"; }

          return (
            <Card key={stat.title} className="border-border bg-card p-6 relative overflow-hidden group hover:shadow-sm transition-all">
              <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-[50px] transition-all group-hover:bg-opacity-20 ${bgGlow.replace('/5', '/10')}`} />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0 mb-4 relative z-10">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <div className={`p-2 rounded-lg ${bgGlow}`}>
                  <Icon className={`h-4 w-4 ${iconColor}`} />
                </div>
              </CardHeader>
              <CardContent className="p-0 relative z-10">
                <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-border bg-card rounded-2xl relative overflow-hidden shadow-sm">
          <CardHeader>
            <CardTitle className="text-foreground">Recent Activity</CardTitle>
            <CardDescription className="text-muted-foreground">Latest platform events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Recent activity will be populated here */}
              <div className="p-8 text-center border border-dashed border-border rounded-xl bg-muted/10">
                <p className="text-sm text-muted-foreground">Activity feed coming soon...</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card rounded-2xl relative overflow-hidden shadow-sm">
          <CardHeader>
            <CardTitle className="text-foreground">Quick Actions</CardTitle>
            <CardDescription className="text-muted-foreground">Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isAdmin && (
                <a href="/admin/deals/new" className="block group">
                  <div className="p-5 rounded-xl border border-border bg-muted/10 hover:bg-muted/20 hover:border-primary/50 transition-all cursor-pointer flex items-center justify-between">
                    <div>
                      <div className="font-bold text-foreground group-hover:text-primary transition-colors">Create New Deal</div>
                      <p className="text-sm text-muted-foreground">Add a new commodity listing</p>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-muted/20 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Package className="h-4 w-4 text-foreground group-hover:text-primary" />
                    </div>
                  </div>
                </a>
              )}

              <a href="/admin/users?filter=kyc_pending" className="block group">
                <div className="p-5 rounded-xl border border-border bg-muted/10 hover:bg-muted/20 hover:border-amber-500/50 transition-all cursor-pointer flex items-center justify-between">
                  <div>
                    <div className="font-bold text-foreground group-hover:text-amber-500 transition-colors">Review KYC Applications</div>
                    <p className="text-sm text-muted-foreground">{pendingKyc} pending reviews</p>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-muted/20 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                    <Users className="h-4 w-4 text-foreground group-hover:text-amber-500" />
                  </div>
                </div>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

