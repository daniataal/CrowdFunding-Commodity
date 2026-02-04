"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Coffee, Boxes, Wheat, Fuel, Leaf, TrendingUp, Clock, Shield } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import type { MarketplaceCommodity } from "@/lib/domain"
import Link from "next/link"
import { Plus } from "lucide-react"

const commodityIcons = {
  coffee: Coffee,
  boxes: Boxes,
  wheat: Wheat,
  fuel: Fuel,
  leaf: Leaf,
  blocks: Boxes,
  gold: Boxes,
  silver: Boxes,
  diesel: Fuel,
  titanium: Boxes,
  palladium: Boxes,
  copper: Boxes,
}

export function MarketplaceView({
  onSelectAsset,
  canCreateListing = false,
}: {
  onSelectAsset: (commodity: MarketplaceCommodity) => void
  canCreateListing?: boolean
}) {
  const [filterType, setFilterType] = useState<string>("All")
  const [filterRisk, setFilterRisk] = useState<string>("All")

  const commoditiesQuery = useQuery({
    queryKey: ["marketplace", "commodities", filterType, filterRisk],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.set("type", filterType)
      params.set("risk", filterRisk)
      const res = await fetch(`/api/marketplace/commodities?${params.toString()}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to load commodities")
      return json.data as MarketplaceCommodity[]
    },
  })

  const filteredCommodities = commoditiesQuery.data ?? []

  const isEmpty = !commoditiesQuery.isLoading && filteredCommodities.length === 0

  const fundedPct = (current: number, required: number) => (required > 0 ? (current / required) * 100 : 0)

  const getStatusLabel = (status: MarketplaceCommodity["status"]) => {
    switch (status) {
      case "FUNDING":
        return "Funding"
      case "IN_TRANSIT":
        return "In Transit"
      case "ARRIVED":
        return "Arrived"
      case "INSPECTED":
        return "Inspected"
      case "RELEASED":
        return "Released"
      case "SETTLED":
        return "Settled"
      case "ACTIVE":
        return "Active"
      case "CANCELLED":
        return "Cancelled"
      default:
        return status
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Filters Sidebar */}
      <aside className="lg:w-72 space-y-6">
        {canCreateListing && (
          <Card className="p-6 border-border bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl relative overflow-hidden group border border-primary/20">
            <div className="absolute top-0 right-0 w-20 h-20 bg-primary/20 rounded-full blur-[40px]" />
            <div className="flex items-center justify-between relative z-10">
              <div>
                <div className="font-bold text-foreground text-lg">Admin</div>
                <div className="text-xs text-muted-foreground mt-1">Create listing</div>
              </div>
              <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20">
                <Link href="/admin/deals/new">
                  <Plus className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </Card>
        )}
        <Card className="p-6 border-border bg-card rounded-2xl shadow-sm">
          <h3 className="font-semibold mb-4 text-foreground text-lg">Commodity Type</h3>
          <div className="space-y-2">
            {["All", "Agriculture", "Energy", "Metals"].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all ${filterType === type
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
              >
                {type}
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-6 border-border bg-card rounded-2xl shadow-sm">
          <h3 className="font-semibold mb-4 text-foreground text-lg">Risk Level</h3>
          <div className="space-y-2">
            {["All", "Low", "Medium", "High"].map((risk) => (
              <button
                key={risk}
                onClick={() => setFilterRisk(risk)}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all ${filterRisk === risk
                  ? "bg-muted text-foreground border border-border"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
              >
                {risk}
              </button>
            ))}
          </div>
        </Card>
      </aside>

      {/* Investment Cards Grid */}
      <div className="flex-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {isEmpty && (
            <Card className="p-12 border border-border bg-muted/10 md:col-span-2 text-center rounded-2xl border-dashed">
              <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Boxes className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">No deals found</h3>
              <div className="text-muted-foreground">Try adjusting your filters to see more opportunities.</div>
            </Card>
          )}
          {filteredCommodities.map((commodity) => {
            const Icon = commodityIcons[commodity.icon as keyof typeof commodityIcons] || Boxes
            const fundedPercentage = fundedPct(commodity.currentAmount, commodity.amountRequired)

            return (
              <Card
                key={commodity.id}
                className="p-6 border-border bg-card rounded-2xl relative overflow-hidden group hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 cursor-pointer"
                onClick={() => onSelectAsset(commodity)}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-[60px] group-hover:bg-primary/10 transition-colors" />

                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-6">
                    <div className="h-14 w-14 rounded-xl bg-muted/50 flex items-center justify-center border border-border group-hover:border-primary/50 group-hover:bg-primary/10 transition-colors">
                      <Icon className="h-7 w-7 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        commodity.risk === "Low"
                          ? "border-green-500/30 text-green-500 bg-green-500/5"
                          : commodity.risk === "Medium"
                            ? "border-orange-500/30 text-orange-500 bg-orange-500/5"
                            : "border-primary/30 text-primary bg-primary/5"
                      }
                    >
                      {commodity.risk} Risk
                    </Badge>
                  </div>

                  <h3 className="text-xl font-bold mb-2 text-foreground group-hover:text-primary transition-colors pr-8">
                    {commodity.name}
                  </h3>

                  {commodity.type === "Metals" && (
                    <div className="mb-4 flex flex-wrap gap-2">
                      {commodity.metalForm && <span className="text-[10px] bg-muted border border-border px-2 py-1 rounded text-muted-foreground uppercase tracking-wider">{commodity.metalForm}</span>}
                      {commodity.purityPercent && <span className="text-[10px] bg-muted border border-border px-2 py-1 rounded text-muted-foreground uppercase tracking-wider">{commodity.purityPercent}% Purity</span>}
                    </div>
                  )}

                  {commodity.type !== "Metals" && (
                    <p className="text-sm text-muted-foreground mb-6 line-clamp-2 h-10 leading-relaxed">{commodity.description}</p>
                  )}

                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-muted/30 p-3 rounded-xl border border-border/50">
                      <div className="flex items-center text-primary mb-1">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">APY</span>
                      </div>
                      <p className="text-xl font-bold text-foreground">{commodity.targetApy}%</p>
                    </div>
                    <div className="bg-muted/30 p-3 rounded-xl border border-border/50">
                      <div className="flex items-center text-muted-foreground mb-1">
                        <Clock className="h-3 w-3 mr-1" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Term</span>
                      </div>
                      <p className="text-xl font-bold text-foreground">{commodity.duration}d</p>
                    </div>
                    <div className="bg-muted/30 p-3 rounded-xl border border-border/50">
                      <div className="flex items-center text-muted-foreground mb-1">
                        <Shield className="h-3 w-3 mr-1" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Safe</span>
                      </div>
                      <p className="text-xl font-bold text-foreground">{commodity.insuranceValue ? "Yes" : "No"}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-muted-foreground">Funding Progress</span>
                      <span className="font-bold text-foreground">{fundedPercentage.toFixed(0)}%</span>
                    </div>
                    <Progress value={fundedPercentage} className="h-2 bg-muted" />
                    <div className="flex justify-between text-xs text-muted-foreground font-mono">
                      <span>${commodity.currentAmount.toLocaleString()}</span>
                      <span>of ${commodity.amountRequired.toLocaleString()}</span>
                    </div>
                  </div>

                  <Button
                    className="w-full mt-6 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20 h-12 rounded-xl"
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelectAsset(commodity)
                    }}
                  >
                    View Details
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
