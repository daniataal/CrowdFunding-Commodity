import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Plus, Edit, Eye, TrendingUp, DollarSign, Calendar, Package } from "lucide-react"
import { format } from "date-fns"
import { auth } from "@/auth"

export const dynamic = "force-dynamic"

export default async function DealsPage() {
  const session = await auth()
  const isAdmin = session?.user?.role === "ADMIN"

  const commodities = await prisma.commodity.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { investments: true },
      },
    },
  })

  const stats = {
    total: commodities.length,
    funding: commodities.filter((c) => c.status === "FUNDING").length,
    active: commodities.filter((c) => c.status === "ACTIVE").length,
    completed: commodities.filter((c) => c.status === "SETTLED").length,
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground tracking-tight">Deal Management</h2>
          <p className="text-muted-foreground mt-1">Create and manage commodity listings</p>
        </div>
        {isAdmin && (
          <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 px-6 rounded-xl h-11 font-semibold">
            <Link href="/admin/deals/new">
              <Plus className="mr-2 h-4 w-4" />
              Create New Deal
            </Link>
          </Button>
        )}
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border bg-card relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-primary/10 rounded-full blur-[40px]" />
          <CardHeader className="pb-3 relative z-10">
            <CardDescription className="text-muted-foreground text-xs uppercase tracking-wider font-medium">Total Deals</CardDescription>
            <CardTitle className="text-3xl font-bold text-foreground">{stats.total}</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">All commodities</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-accent/10 rounded-full blur-[40px]" />
          <CardHeader className="pb-3 relative z-10">
            <CardDescription className="text-muted-foreground text-xs uppercase tracking-wider font-medium">Funding</CardDescription>
            <CardTitle className="text-3xl font-bold text-accent">{stats.funding}</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-accent" />
              <span className="text-xs text-muted-foreground">Seeking investment</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-primary/10 rounded-full blur-[40px]" />
          <CardHeader className="pb-3 relative z-10">
            <CardDescription className="text-muted-foreground text-xs uppercase tracking-wider font-medium">Active</CardDescription>
            <CardTitle className="text-3xl font-bold text-primary">{stats.active}</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">In progress</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/10 rounded-full blur-[40px]" />
          <CardHeader className="pb-3 relative z-10">
            <CardDescription className="text-muted-foreground text-xs uppercase tracking-wider font-medium">Completed</CardDescription>
            <CardTitle className="text-3xl font-bold text-green-500">{stats.completed}</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-green-500" />
              <span className="text-xs text-muted-foreground">Settled</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Deals Grid */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">All Deals</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {commodities.map((commodity) => {
            const fundedPercentage = Number(commodity.amountRequired) > 0
              ? (Number(commodity.currentAmount) / Number(commodity.amountRequired)) * 100
              : 0

            return (
              <Card key={commodity.id} className="border-border bg-card rounded-2xl relative overflow-hidden group hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-[60px] group-hover:bg-primary/10 transition-colors duration-300" />

                <CardHeader className="relative z-10 pb-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 flex-1 min-w-0">
                      <CardTitle className="text-lg font-bold text-foreground leading-tight truncate">{commodity.name}</CardTitle>
                      <CardDescription className="text-sm text-muted-foreground font-medium">{commodity.type}</CardDescription>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        commodity.status === "FUNDING"
                          ? "border-accent/50 text-accent bg-accent/10 shrink-0"
                          : commodity.status === "ACTIVE"
                            ? "border-primary/50 text-primary bg-primary/10 shrink-0"
                            : commodity.status === "SETTLED"
                              ? "border-green-500/50 text-green-500 bg-green-500/10 shrink-0"
                              : "border-border text-muted-foreground bg-muted/50 shrink-0"
                      }
                    >
                      {commodity.status}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-5 relative z-10">
                  {/* Funding Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Funding Progress</span>
                      <span className="font-bold text-foreground">{fundedPercentage.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-accent to-accent/70 shadow-[0_0_10px_rgba(217,119,6,0.3)] transition-all duration-500"
                        style={{ width: `${Math.min(fundedPercentage, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground font-mono">
                      <span>${Number(commodity.currentAmount).toLocaleString()}</span>
                      <span>${Number(commodity.amountRequired).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Key Metrics */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-muted/30 p-3 rounded-xl border border-border">
                      <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">APY</span>
                      <span className="font-bold text-foreground text-base">{Number(commodity.targetApy)}%</span>
                    </div>
                    <div className="bg-muted/30 p-3 rounded-xl border border-border">
                      <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Duration</span>
                      <span className="font-bold text-foreground text-base">{commodity.duration}d</span>
                    </div>
                    <div className="bg-muted/30 p-3 rounded-xl border border-border">
                      <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Investors</span>
                      <span className="font-bold text-foreground text-base">{commodity._count.investments}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    {isAdmin && (
                      <Button asChild variant="outline" className="flex-1 border-border bg-background hover:bg-muted hover:border-primary/30 transition-all" size="sm">
                        <Link href={`/admin/deals/${commodity.id}/edit`}>
                          <Edit className="mr-2 h-3.5 w-3.5" />
                          Edit
                        </Link>
                      </Button>
                    )}
                    <Button asChild className="flex-1 bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 hover:border-primary/30 transition-all" size="sm">
                      <Link href={`/admin/deals/${commodity.id}`}>
                        <Eye className="mr-2 h-3.5 w-3.5" />
                        View
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {commodities.length === 0 && (
          <Card className="border-dashed border-2 border-border bg-muted/20 p-12">
            <div className="text-center space-y-3">
              <Package className="h-12 w-12 text-muted-foreground mx-auto opacity-50" />
              <h3 className="text-lg font-semibold text-foreground">No deals yet</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Get started by creating your first commodity deal. Click the "Create New Deal" button above.
              </p>
              {isAdmin && (
                <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 mt-4">
                  <Link href="/admin/deals/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Deal
                  </Link>
                </Button>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
