import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Package, DollarSign, TrendingUp } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function AdminDashboard() {
  const session = await auth()

  if (!session?.user || session.user.role !== "ADMIN") {
    return null
  }

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
      value: `$${((totalVolume._sum.amount || 0) / 1000).toFixed(0)}k`,
      description: "Total investment volume",
      icon: DollarSign,
      color: "text-purple-500",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className="border-2">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest platform events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Recent activity will be populated here */}
              <p className="text-sm text-muted-foreground">Activity feed coming soon...</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <a href="/admin/deals/new">
                <Card className="p-4 hover:bg-muted cursor-pointer transition-colors">
                  <div className="font-medium">Create New Deal</div>
                  <p className="text-sm text-muted-foreground">Add a new commodity listing</p>
                </Card>
              </a>
              <a href="/admin/users?filter=kyc_pending">
                <Card className="p-4 hover:bg-muted cursor-pointer transition-colors">
                  <div className="font-medium">Review KYC Applications</div>
                  <p className="text-sm text-muted-foreground">{pendingKyc} pending reviews</p>
                </Card>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

