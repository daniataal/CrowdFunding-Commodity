"use client"

import Link from "next/link"
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import type { MarketplaceCommodity } from "@/lib/domain"
import { TrendingUp, Clock, Shield, Boxes } from "lucide-react"
import { PublicFooter } from "@/components/public-footer"

const TYPE_OPTIONS = ["All", "Agriculture", "Energy", "Metals"] as const
const RISK_OPTIONS = ["All", "Low", "Medium", "High"] as const

function fundedPct(current: number, required: number) {
  return required > 0 ? (current / required) * 100 : 0
}

export default function PublicMarketplacePage() {
  const [filterType, setFilterType] = useState<(typeof TYPE_OPTIONS)[number]>("All")
  const [filterRisk, setFilterRisk] = useState<(typeof RISK_OPTIONS)[number]>("All")

  const commoditiesQuery = useQuery({
    queryKey: ["public", "marketplace", "commodities", filterType, filterRisk],
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

  const commodities = commoditiesQuery.data ?? []
  const isEmpty = !commoditiesQuery.isLoading && commodities.length === 0

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Marketplace</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Browse active funding rounds for commodity shipments. Sign in to invest.
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" className="bg-transparent">
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Link href="/register">Create account</Link>
            </Button>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[260px_1fr]">
          <aside className="space-y-4">
            <Card className="p-4 border-2 bg-card/50 backdrop-blur">
              <div className="font-semibold mb-3">Commodity Type</div>
              <div className="space-y-2">
                {TYPE_OPTIONS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setFilterType(t)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      filterType === t ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </Card>

            <Card className="p-4 border-2 bg-card/50 backdrop-blur">
              <div className="font-semibold mb-3">Risk Level</div>
              <div className="space-y-2">
                {RISK_OPTIONS.map((r) => (
                  <button
                    key={r}
                    onClick={() => setFilterRisk(r)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      filterRisk === r ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </Card>
          </aside>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {isEmpty && (
              <Card className="p-6 border-2 bg-card/50 backdrop-blur md:col-span-2">
                <div className="text-muted-foreground">No deals match your filters.</div>
              </Card>
            )}

            {commodities.map((c) => {
              const pct = fundedPct(c.currentAmount, c.amountRequired)
              return (
                <Link key={c.id} href={`/marketplace/${c.id}`} className="block">
                  <Card className="p-6 border-2 bg-card/50 backdrop-blur hover:border-primary/50 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                      <div className="h-12 w-12 rounded-lg bg-amber-500/10 flex items-center justify-center">
                        <Boxes className="h-6 w-6 text-amber-500" />
                      </div>
                      <Badge variant="outline">{c.risk} Risk</Badge>
                    </div>

                    <div className="text-lg font-semibold">{c.name}</div>
                    <div className="mt-1 text-sm text-muted-foreground line-clamp-2">{c.description}</div>

                    <div className="mt-4 grid grid-cols-3 gap-4">
                      <div>
                        <div className="flex items-center text-emerald-500 mb-1">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          <span className="text-xs font-medium">APY</span>
                        </div>
                        <div className="text-lg font-bold">{c.targetApy}%</div>
                      </div>
                      <div>
                        <div className="flex items-center text-muted-foreground mb-1">
                          <Clock className="h-3 w-3 mr-1" />
                          <span className="text-xs font-medium">Duration</span>
                        </div>
                        <div className="text-lg font-bold">{c.duration}d</div>
                      </div>
                      <div>
                        <div className="flex items-center text-muted-foreground mb-1">
                          <Shield className="h-3 w-3 mr-1" />
                          <span className="text-xs font-medium">Insured</span>
                        </div>
                        <div className="text-lg font-bold">{c.insuranceValue ? "Yes" : "No"}</div>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Funding Progress</span>
                        <span className="font-semibold">{pct.toFixed(0)}%</span>
                      </div>
                      <Progress value={pct} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>${c.currentAmount.toLocaleString()}</span>
                        <span>of ${c.amountRequired.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="mt-4">
                      <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">View Deal</Button>
                    </div>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
      <PublicFooter />
    </>
  )
}


