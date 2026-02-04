import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Plus, Edit, Eye } from "lucide-react"
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white">Deal Management</h2>
          <p className="text-muted-foreground">Create and manage commodity listings</p>
        </div>
        {isAdmin && (
          <Button asChild className="bg-primary hover:bg-red-600 text-white shadow-lg shadow-red-500/20 px-6 rounded-xl">
            <Link href="/admin/deals/new">
              <Plus className="mr-2 h-4 w-4" />
              Create New Deal
            </Link>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {commodities.map((commodity) => {
          const fundedPercentage = Number(commodity.amountRequired) > 0
            ? (Number(commodity.currentAmount) / Number(commodity.amountRequired)) * 100
            : 0

          return (
            <Card key={commodity.id} className="border border-white/10 bg-[#0A0A0A] rounded-2xl relative overflow-hidden group hover:border-white/20 transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-[60px] group-hover:bg-primary/10 transition-colors" />

              <CardHeader className="relative z-10">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-bold text-white leading-tight">{commodity.name}</CardTitle>
                    <CardDescription className="text-sm text-muted-foreground font-medium">{commodity.type}</CardDescription>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      commodity.status === "FUNDING"
                        ? "border-amber-500/20 text-amber-500 bg-amber-500/10"
                        : commodity.status === "ACTIVE"
                          ? "border-emerald-500/20 text-emerald-500 bg-emerald-500/10"
                          : "border-slate-500/20 text-slate-400 bg-slate-500/5"
                    }
                  >
                    {commodity.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 relative z-10">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Funding Progress</span>
                    <span className="font-bold text-white">{fundedPercentage.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)] transition-all"
                      style={{ width: `${Math.min(fundedPercentage, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground font-mono">
                    <span>${Number(commodity.currentAmount).toLocaleString()}</span>
                    <span>${Number(commodity.amountRequired).toLocaleString()}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm bg-white/[0.02] p-3 rounded-xl border border-white/5">
                  <div>
                    <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">APY</span>
                    <span className="font-bold text-white text-lg">{Number(commodity.targetApy)}%</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Duration</span>
                    <span className="font-bold text-white text-lg">{commodity.duration}d</span>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  {isAdmin && (
                    <Button asChild variant="outline" className="w-full flex-1 border-white/10 text-white hover:bg-white/10 hover:text-white" size="sm">
                      <Link href={`/admin/deals/${commodity.id}/edit`}>
                        <Edit className="mr-2 h-3 w-3" />
                        Edit
                      </Link>
                    </Button>
                  )}
                  <Button asChild className="w-full flex-1 bg-white/5 border border-white/10 text-white hover:bg-white/10" size="sm">
                    <Link href={`/admin/deals/${commodity.id}`}>
                      <Eye className="mr-2 h-3 w-3" />
                      View
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

