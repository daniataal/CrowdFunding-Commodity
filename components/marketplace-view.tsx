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
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Filters Sidebar */}
      <aside className="lg:w-64 space-y-4">
        {canCreateListing && (
          <Card className="p-4 border-2 bg-card/50 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">Admin</div>
                <div className="text-xs text-muted-foreground">Create a new marketplace listing</div>
              </div>
              <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Link href="/admin/deals/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Create
                </Link>
              </Button>
            </div>
          </Card>
        )}
        <Card className="p-4 border-2 bg-card/50 backdrop-blur">
          <h3 className="font-semibold mb-3">Commodity Type</h3>
          <div className="space-y-2">
            {["All", "Agriculture", "Energy", "Metals"].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  filterType === type ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-4 border-2 bg-card/50 backdrop-blur">
          <h3 className="font-semibold mb-3">Risk Level</h3>
          <div className="space-y-2">
            {["All", "Low", "Medium", "High"].map((risk) => (
              <button
                key={risk}
                onClick={() => setFilterRisk(risk)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  filterRisk === risk ? "bg-primary text-primary-foreground" : "hover:bg-muted"
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {isEmpty && (
            <Card className="p-6 border-2 bg-card/50 backdrop-blur md:col-span-2">
              <div className="text-muted-foreground">No deals match your filters.</div>
            </Card>
          )}
          {filteredCommodities.map((commodity) => {
            const Icon = commodityIcons[commodity.icon as keyof typeof commodityIcons] || Boxes
            const fundedPercentage = fundedPct(commodity.currentAmount, commodity.amountRequired)

            return (
              <Card
                key={commodity.id}
                className="p-6 border-2 bg-card/50 backdrop-blur hover:border-primary/50 transition-colors cursor-pointer group"
                onClick={() => onSelectAsset(commodity)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="h-12 w-12 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <Icon className="h-6 w-6 text-amber-500" />
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      commodity.risk === "Low"
                        ? "border-emerald-500/50 text-emerald-500"
                        : commodity.risk === "Medium"
                          ? "border-amber-500/50 text-amber-500"
                          : "border-red-500/50 text-red-500"
                    }
                  >
                    {commodity.risk} Risk
                  </Badge>
                </div>

                <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                  {commodity.name}
                </h3>
                {commodity.type === "Metals" && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {commodity.metalForm ? <Badge variant="outline">{commodity.metalForm}</Badge> : null}
                    {commodity.purityPercent ? <Badge variant="outline">Purity {commodity.purityPercent}%</Badge> : null}
                    {commodity.karat ? <Badge variant="outline">{commodity.karat}K</Badge> : null}
                    {commodity.refineryLocation ? <Badge variant="outline">{commodity.refineryLocation}</Badge> : null}
                  </div>
                )}
                <p className="text-sm text-muted-foreground mb-4">{commodity.description}</p>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <div className="flex items-center text-emerald-500 mb-1">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      <span className="text-xs font-medium">APY</span>
                    </div>
                    <p className="text-lg font-bold">{commodity.targetApy}%</p>
                  </div>
                  <div>
                    <div className="flex items-center text-muted-foreground mb-1">
                      <Clock className="h-3 w-3 mr-1" />
                      <span className="text-xs font-medium">Duration</span>
                    </div>
                    <p className="text-lg font-bold">{commodity.duration}d</p>
                  </div>
                  <div>
                    <div className="flex items-center text-muted-foreground mb-1">
                      <Shield className="h-3 w-3 mr-1" />
                      <span className="text-xs font-medium">Insured</span>
                    </div>
                    <p className="text-lg font-bold">{commodity.insuranceValue ? "Yes" : "No"}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Funding Progress</span>
                    <span className="font-semibold">{fundedPercentage.toFixed(0)}%</span>
                  </div>
                  <Progress value={fundedPercentage} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>${commodity.currentAmount.toLocaleString()}</span>
                    <span>of ${commodity.amountRequired.toLocaleString()}</span>
                  </div>
                </div>

                <Button
                  className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={(e) => {
                    e.stopPropagation()
                    onSelectAsset(commodity)
                  }}
                >
                  View Details
                </Button>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
