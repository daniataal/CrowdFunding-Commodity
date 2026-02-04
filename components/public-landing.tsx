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
    <div className="min-h-screen bg-background relative overflow-hidden text-foreground selection:bg-primary selection:text-white">
      {/* Background Ambience */}
      <div className="fixed top-0 right-0 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] pointer-events-none -z-10 translate-x-1/3 -translate-y-1/3" />
      <div className="fixed bottom-0 left-0 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[100px] pointer-events-none -z-10 -translate-x-1/3 translate-y-1/3" />
      <div className="fixed inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.03] pointer-events-none -z-10" />

      <PublicHeader />

      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <section className="grid gap-12 lg:grid-cols-2 lg:items-center min-h-[60vh]">
          <div className="space-y-8 relative">
            <div className="absolute -left-10 -top-10 w-32 h-32 bg-primary/20 blur-3xl rounded-full" />
            <Badge variant="outline" className="border-primary/50 text-primary uppercase tracking-widest text-xs py-1.5 px-4 backdrop-blur-md">
              Verified • Transparent • Secure
            </Badge>
            <h1 className="text-6xl font-extrabold tracking-tight sm:text-7xl lg:text-8xl text-white leading-[0.9]">
              Trade <span className="text-primary transparent-text-outline" style={{ WebkitTextStroke: "1px rgba(239,68,68,0.5)", color: "transparent", WebkitBackgroundClip: "text", backgroundClip: "text", backgroundImage: "linear-gradient(to bottom right, #EF4444, #F59E0B)" }}>Gold</span> <br />like a Pro.
            </h1>
            <p className="text-muted-foreground text-xl leading-relaxed max-w-lg font-light">
              Fund real-world commodity shipments and earn yield. The world's first decentralized physical commodity investment platform. Capital is at risk.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Button asChild size="lg" className="bg-primary hover:bg-red-600 text-white font-bold rounded-full px-10 h-14 text-lg shadow-[0_0_40px_-10px_rgba(239,68,68,0.5)] hover:shadow-[0_0_60px_-15px_rgba(239,68,68,0.7)] transition-all transform hover:-translate-y-1">
                <Link href="/register">
                  Start Trading <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/10 hover:bg-white/5 hover:text-white rounded-full px-8 h-14 text-lg backdrop-blur-sm">
                <Link href="/how-it-works">How it Works</Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 relative perspective-1000">
            {/* Decorative floaty elements */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-primary/10 to-amber-500/10 blur-[80px] rounded-full pointer-events-none" />

            <Card className="border border-white/10 bg-[#0A0A0A]/80 backdrop-blur-xl p-8 hover:bg-[#111] transition-all hover:scale-[1.02] duration-300 shadow-2xl">
              <div className="flex flex-col gap-4">
                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                  <Shield className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <div className="font-bold text-xl text-white mb-1">KYC & Audit</div>
                  <div className="text-sm text-muted-foreground leading-relaxed">Bank-grade compliance and real-time auditing.</div>
                </div>
              </div>
            </Card>
            <Card className="border border-white/10 bg-[#0A0A0A]/80 backdrop-blur-xl p-8 hover:bg-[#111] transition-all hover:scale-[1.02] duration-300 shadow-2xl sm:translate-y-12">
              <div className="flex flex-col gap-4">
                <div className="h-14 w-14 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                  <FileText className="h-7 w-7 text-amber-500" />
                </div>
                <div>
                  <div className="font-bold text-xl text-white mb-1">Verified Docs</div>
                  <div className="text-sm text-muted-foreground leading-relaxed">100% Transparent documentation for every deal.</div>
                </div>
              </div>
            </Card>
            <Link href="/how-it-works" className="sm:col-span-2 group mt-6 sm:mt-12">
              <Card className="border border-white/10 bg-[#0A0A0A]/80 backdrop-blur-xl p-6 hover:border-primary/50 transition-all">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-lg text-white group-hover:text-primary transition-colors flex items-center gap-2">
                    See How it Works <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <div className="flex space-x-1">
                    {[1, 2, 3].map(i => <div key={i} className={`h-2 w-2 rounded-full ${i === 1 ? 'bg-primary' : 'bg-white/20'}`} />)}
                  </div>
                </div>
              </Card>
            </Link>
          </div>
        </section>

        {/* Partners Section */}
        <section className="mt-32 border-y border-white/5 py-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-white/[0.01]" />
          <div className="text-center text-xs font-bold text-muted-foreground mb-10 uppercase tracking-[0.3em]">Trusted by Global Leaders</div>
          <div className="flex flex-wrap items-center justify-center gap-12 md:gap-24 opacity-40 grayscale hover:grayscale-0 transition-all duration-700 hover:opacity-100">
            <div className="flex items-center gap-3 text-2xl font-black text-white"><Globe2 className="h-8 w-8" /> GlobalTrade</div>
            <div className="flex items-center gap-3 text-2xl font-black text-white"><Building2 className="h-8 w-8" /> AgriCorp</div>
            <div className="flex items-center gap-3 text-2xl font-black text-white"><Briefcase className="h-8 w-8" /> MaritimeFund</div>
            <div className="flex items-center gap-3 text-2xl font-black text-white"><Shield className="h-8 w-8" /> SecurePort</div>
          </div>
        </section>

        <section className="mt-32 space-y-10">
          <div className="flex items-end justify-between gap-4 border-b border-white/5 pb-8">
            <div>
              <h2 className="text-4xl font-bold text-white tracking-tight">Featured Deals</h2>
              <p className="text-muted-foreground mt-2 text-lg">High-yield opportunities closing soon.</p>
            </div>
            <Button asChild variant="ghost" className="text-primary hover:text-red-400 hover:bg-transparent p-0 text-lg group">
              <Link href="/marketplace">View all deals <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" /></Link>
            </Button>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {featured.map((c) => {
              const pct = fundedPct(c.currentAmount, c.amountRequired)
              return (
                <Link key={c.id} href={`/marketplace/${c.id}`} className="block group h-full">
                  <Card className="h-full border border-white/10 bg-[#0A0A0A] p-8 hover:border-primary/50 hover:shadow-[0_0_40px_rgba(239,68,68,0.15)] transition-all duration-500 rounded-2xl relative overflow-hidden flex flex-col">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-[50px] group-hover:bg-primary/10 transition-colors" />

                    <div className="flex items-start justify-between mb-6 relative z-10">
                      <div className="space-y-1">
                        <div className="font-bold text-2xl text-white group-hover:text-primary transition-colors">{c.name}</div>
                        <div className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded bg-white/5 w-fit text-muted-foreground border border-white/5">{c.type}</div>
                      </div>
                      <Badge variant="outline" className={
                        c.risk === "Low" ? "border-primary/30 text-primary bg-primary/5" :
                          c.risk === "Medium" ? "border-orange-500/30 text-orange-500 bg-orange-500/5" :
                            "border-red-500/30 text-red-500 bg-red-500/5"
                      }>{c.risk} Risk</Badge>
                    </div>

                    <div className="space-y-8 flex-1 flex flex-col justify-end relative z-10">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/[0.02] rounded-xl p-3 border border-white/5">
                          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">APY</div>
                          <div className="text-3xl font-bold text-primary">{Number(c.targetApy).toFixed(1)}%</div>
                        </div>
                        <div className="text-right bg-white/[0.02] rounded-xl p-3 border border-white/5">
                          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Term</div>
                          <div className="text-2xl font-bold text-white">{c.duration}d</div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between text-xs font-semibold uppercase tracking-wider">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="text-white">{pct.toFixed(0)}%</span>
                        </div>
                        <Progress value={pct} className="h-2 bg-white/5" />
                        <div className="flex justify-between text-xs text-muted-foreground font-mono">
                          <span>${Number(c.currentAmount).toLocaleString()}</span>
                          <span>${Number(c.amountRequired).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              )
            })}

            {!featuredQuery.isLoading && featured.length === 0 && (
              <Card className="border border-white/10 bg-[#0A0A0A] p-16 md:col-span-3 text-center rounded-2xl">
                <div className="text-2xl font-bold text-white mb-3">No Active Deals</div>
                <p className="text-muted-foreground text-lg">New opportunities are vetted daily. Join the waitlist to get notified.</p>
              </Card>
            )}
          </div>
        </section>

        {/* Testimonials */}
        <section className="mt-32 mb-20">
          <h2 className="text-4xl font-bold text-center mb-16 text-white">Join the Smart Money</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="p-10 border border-white/5 bg-[#0A0A0A] relative overflow-hidden group hover:border-white/10 transition-colors">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary group-hover:shadow-[0_0_15px_rgba(239,68,68,0.5)] transition-shadow"></div>
              <Quote className="h-10 w-10 text-primary/20 mb-6" />
              <p className="text-xl text-gray-300 mb-8 leading-relaxed italic">"CommodityFlow gave us access to an asset class that was previously reserved for billionaires. As a firm, we value the unmatched transparency."</p>
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center font-bold text-white border border-white/10">SJ</div>
                <div>
                  <div className="font-bold text-white text-lg">Sarah Jenkins</div>
                  <div className="text-xs text-primary font-bold tracking-widest uppercase">Zenith Capital</div>
                </div>
              </div>
            </Card>
            <Card className="p-10 border border-white/5 bg-[#0A0A0A] relative overflow-hidden group hover:border-white/10 transition-colors">
              <div className="absolute top-0 left-0 w-1 h-full bg-amber-500 group-hover:shadow-[0_0_15px_rgba(245,158,11,0.5)] transition-shadow"></div>
              <Quote className="h-10 w-10 text-amber-500/20 mb-6" />
              <p className="text-xl text-gray-300 mb-8 leading-relaxed italic">"The platform is intuitive and the due diligence materials are comprehensive. I finally feel safe deploying capital effectively."</p>
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center font-bold text-white border border-white/10">DC</div>
                <div>
                  <div className="font-bold text-white text-lg">David Chen</div>
                  <div className="text-xs text-amber-500 font-bold tracking-widest uppercase">Angel Investor</div>
                </div>
              </div>
            </Card>
          </div>
        </section>
      </main>
    </div>
  )
}
