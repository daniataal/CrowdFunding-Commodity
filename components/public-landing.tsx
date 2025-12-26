"use client"

import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import type { MarketplaceCommodity } from "@/lib/domain"
import { Shield, TrendingUp, FileText, ArrowRight } from "lucide-react"

function fundedPct(current: number, required: number) {
  return required > 0 ? (current / required) * 100 : 0
}

export function PublicLanding() {
  const featuredQuery = useQuery({
    queryKey: ["public", "marketplace", "featured"],
    queryFn: async () => {
      const res = await fetch("/api/marketplace/commodities?type=All&risk=All")
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to load marketplace")
      return (json.data as MarketplaceCommodity[]).slice(0, 3)
    },
  })

  const featured = featuredQuery.data ?? []

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card/50 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-lg font-bold leading-none">CommodityFlow</div>
                <div className="hidden text-xs text-muted-foreground sm:block">Commodity crowdfunding, done right</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button asChild variant="ghost">
                <Link href="/marketplace">Marketplace</Link>
              </Button>
              <Button asChild variant="outline" className="bg-transparent">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Link href="/register">Get started</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div className="space-y-5">
            <Badge variant="outline" className="border-emerald-500/30 text-emerald-500">
              Verified documents • Transparent lifecycle
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Fund real-world commodity shipments and earn yield.
            </h1>
            <p className="text-muted-foreground text-base">
              Browse vetted deals across Agriculture, Energy, and Metals. Each listing includes funding progress,
              shipping route, and verified documentation.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button asChild size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Link href="/marketplace">
                  Explore marketplace <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="bg-transparent">
                <Link href="/legal/risk-disclosure">Read risk disclosure</Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="border-2 bg-card/50 backdrop-blur p-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <div className="font-semibold">KYC & audit trail</div>
                  <div className="text-sm text-muted-foreground">Role-based admin and immutable logging.</div>
                </div>
              </div>
            </Card>
            <Card className="border-2 bg-card/50 backdrop-blur p-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <div className="font-semibold">Verified documents</div>
                  <div className="text-sm text-muted-foreground">Contracts, insurance, and certifications.</div>
                </div>
              </div>
            </Card>
            <Card className="border-2 bg-card/50 backdrop-blur p-6 sm:col-span-2">
              <div className="font-semibold">How it works</div>
              <div className="mt-2 grid gap-2 text-sm text-muted-foreground">
                <div>1) Create an account and complete KYC.</div>
                <div>2) Deposit funds into your wallet.</div>
                <div>3) Invest in a deal and track shipment progress.</div>
              </div>
            </Card>
          </div>
        </section>

        <section className="mt-12 space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">Featured deals</h2>
              <p className="text-sm text-muted-foreground">A quick look at what’s currently funding.</p>
            </div>
            <Button asChild variant="outline" className="bg-transparent">
              <Link href="/marketplace">View all</Link>
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {featured.map((c) => {
              const pct = fundedPct(c.currentAmount, c.amountRequired)
              return (
                <Link key={c.id} href={`/marketplace/${c.id}`} className="block">
                  <Card className="border-2 bg-card/50 backdrop-blur p-6 hover:border-primary/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="font-semibold">{c.name}</div>
                        <div className="text-xs text-muted-foreground">{c.type}</div>
                      </div>
                      <Badge variant="outline">{c.risk} Risk</Badge>
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Funding</span>
                        <span className="font-medium text-foreground">{pct.toFixed(0)}%</span>
                      </div>
                      <Progress value={pct} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>${c.currentAmount.toLocaleString()}</span>
                        <span>of ${c.amountRequired.toLocaleString()}</span>
                      </div>
                    </div>
                  </Card>
                </Link>
              )
            })}

            {!featuredQuery.isLoading && featured.length === 0 && (
              <Card className="border-2 bg-card/50 backdrop-blur p-6 md:col-span-3">
                <div className="text-sm text-muted-foreground">No deals available right now.</div>
              </Card>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}


