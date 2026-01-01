"use client"

import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import type { MarketplaceCommodity } from "@/lib/domain"
import { Shield, FileText, ArrowRight, Quote, Building2, Globe2, Briefcase } from "lucide-react"
import { PublicHeader } from "@/components/public-header"

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
      <PublicHeader />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div className="space-y-5">
            <Badge variant="outline" className="border-emerald-500/30 text-emerald-500">
              Verified documents • Transparent lifecycle
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
              Fund real-world commodity shipments and earn yield.
            </h1>
            <p className="text-muted-foreground text-base leading-relaxed">
              Browse vetted deals across Agriculture, Energy, and Metals. Each listing includes funding progress,
              shipping route, and verified documentation. Join the future of trade finance.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button asChild size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20">
                <Link href="/marketplace">
                  Explore marketplace <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="bg-transparent hover:bg-accent/50">
                <Link href="/legal/risk-disclosure">Read risk disclosure</Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="border-2 bg-card/50 backdrop-blur p-6 hover:shadow-md transition-shadow">
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
            <Card className="border-2 bg-card/50 backdrop-blur p-6 hover:shadow-md transition-shadow">
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
            <Link href="/how-it-works" className="sm:col-span-2 group">
              <Card className="border-2 bg-card/50 backdrop-blur p-6 hover:border-emerald-500/30 transition-colors">
                <div className="font-semibold group-hover:text-emerald-500 transition-colors">How it works →</div>
                <div className="mt-2 grid gap-2 text-sm text-muted-foreground">
                  <div>1) Create an account and complete KYC.</div>
                  <div>2) Deposit funds into your wallet.</div>
                  <div>3) Invest in a deal and track shipment progress.</div>
                </div>
              </Card>
            </Link>
          </div>
        </section>

        {/* Partners Section */}
        <section className="mt-20 border-y border-border/50 py-10">
          <div className="text-center text-sm font-medium text-muted-foreground mb-6 uppercase tracking-wider">Trusted by industry leaders</div>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
            <div className="flex items-center gap-2 text-xl font-bold"><Globe2 className="h-6 w-6" /> GlobalTrade</div>
            <div className="flex items-center gap-2 text-xl font-bold"><Building2 className="h-6 w-6" /> AgriCorp</div>
            <div className="flex items-center gap-2 text-xl font-bold"><Briefcase className="h-6 w-6" /> MaritimeFund</div>
            <div className="flex items-center gap-2 text-xl font-bold"><Shield className="h-6 w-6" /> SecurePort</div>
          </div>
        </section>

        <section className="mt-20 space-y-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold">Featured deals</h2>
              <p className="text-muted-foreground mt-2">A quick look at what’s currently funding.</p>
            </div>
            <Button asChild variant="outline" className="bg-transparent">
              <Link href="/marketplace">View all</Link>
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {featured.map((c) => {
              const pct = fundedPct(c.currentAmount, c.amountRequired)
              return (
                <Link key={c.id} href={`/marketplace/${c.id}`} className="block group">
                  <Card className="h-full border-2 bg-card/50 backdrop-blur p-6 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="font-semibold text-lg group-hover:text-emerald-500 transition-colors">{c.name}</div>
                        <div className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted w-fit">{c.type}</div>
                      </div>
                      <Badge variant="outline" className={
                        c.risk === "Low" ? "border-emerald-500/30 text-emerald-500" :
                          c.risk === "Medium" ? "border-amber-500/30 text-amber-500" :
                            "border-red-500/30 text-red-500"
                      }>{c.risk} Risk</Badge>
                    </div>
                    <div className="mt-6 space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Target APY</span>
                          <span className="font-bold">{Number(c.targetApy).toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Duration</span>
                          <span className="font-medium">{c.duration} days</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Funding Progress</span>
                          <span className="font-medium text-foreground">{pct.toFixed(0)}%</span>
                        </div>
                        <Progress value={pct} className="h-2" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>${Number(c.currentAmount).toLocaleString()}</span>
                          <span>of ${Number(c.amountRequired).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              )
            })}

            {!featuredQuery.isLoading && featured.length === 0 && (
              <Card className="border-2 bg-card/50 backdrop-blur p-8 md:col-span-3 text-center">
                <div className="text-lg font-medium">No active deals available right now.</div>
                <p className="text-muted-foreground">Check back later or join our waitlist.</p>
              </Card>
            )}
          </div>
        </section>

        {/* Testimonials */}
        <section className="mt-20 mb-10">
          <h2 className="text-3xl font-bold text-center mb-10">What our investors say</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-8 border-2 bg-card/30 backdrop-blur">
              <Quote className="h-8 w-8 text-emerald-500/20 mb-4" />
              <p className="text-lg italic text-muted-foreground mb-4">"CommodityFlow gave us access to an asset class that was previously reserved for billionaires. The transparency is unmatched."</p>
              <div className="font-semibold">Sarah Jenkins</div>
              <div className="text-xs text-muted-foreground">Portfolio Manager, Zenith Capital</div>
            </Card>
            <Card className="p-8 border-2 bg-card/30 backdrop-blur">
              <Quote className="h-8 w-8 text-emerald-500/20 mb-4" />
              <p className="text-lg italic text-muted-foreground mb-4">"The platform is intuitive and the due diligence materials are comprehensive. I feel safe investing here."</p>
              <div className="font-semibold">David Chen</div>
              <div className="text-xs text-muted-foreground">Angel Investor</div>
            </Card>
          </div>
        </section>
      </main>
    </div>
  )
}
