"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Search, Wallet, Ship, Landmark } from "lucide-react"

export function HowItWorksView() {
    const steps = [
        {
            icon: Search,
            title: "1. Browse Opportunities",
            description: "Explore vetted commodity shipments across Agriculture, Energy, and Metals. View detailed routes, risk assessments, and expected returns.",
        },
        {
            icon: CheckCircle2,
            title: "2. Verify & Onboard",
            description: "Complete our seamless KYC/KYB process. We verify your identity and eligibility to ensure a compliant and secure trading environment.",
        },
        {
            icon: Wallet,
            title: "3. Fund & Invest",
            description: "Deposit funds into your secure wallet and allocate capital to specific shipments. You own a fractional share of the physical cargo.",
        },
        {
            icon: Ship,
            title: "4. Track Shipment",
            description: "Watch your investment move in real-time. Receive updates on departure, transit, and arrival. Transparency at every nautical mile.",
        },
        {
            icon: Landmark,
            title: "5. Earn Returns",
            description: "Once the commodity is delivered and sold, the proceeds (principal + profit) are automatically distributed to your wallet.",
        },
    ]

    return (
        <div className="py-16 sm:py-24">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <Badge variant="outline" className="mb-4 border-emerald-500/30 text-emerald-500">
                        Simple Process
                    </Badge>
                    <h1 className="text-4xl font-bold tracking-tight mb-4">How CommodityFlow Works</h1>
                    <p className="text-lg text-muted-foreground">
                        Democratizing access to global trade finance. We bridge the gap between investors looking for yield and commodity traders needing liquidity.
                    </p>
                </div>

                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 relative">
                    {/* Connector Line (Desktop) */}
                    <div className="hidden lg:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-emerald-500/0 via-emerald-500/30 to-emerald-500/0 -z-10" />

                    {steps.map((step, i) => {
                        const Icon = step.icon
                        return (
                            <Card key={i} className="relative p-6 border-2 bg-card/50 backdrop-blur hover:border-emerald-500/30 transition-all duration-300 group">
                                <div className="absolute -top-6 left-6 h-12 w-12 rounded-xl bg-background border-2 border-emerald-500/20 group-hover:border-emerald-500 flex items-center justify-center transition-colors shadow-sm">
                                    <Icon className="h-6 w-6 text-emerald-500" />
                                </div>
                                <div className="mt-8">
                                    <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                                    <p className="text-muted-foreground leading-relaxed">
                                        {step.description}
                                    </p>
                                </div>
                            </Card>
                        )
                    })}
                </div>

                <div className="mt-20 rounded-2xl border bg-muted/30 p-8 md:p-12 text-center">
                    <h2 className="text-2xl font-bold mb-4">Ready to start?</h2>
                    <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                        Join hundreds of investors funding global trade today. Sign up takes less than 5 minutes.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <a href="/register" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-emerald-600 text-primary-foreground hover:bg-emerald-700 h-11 px-8">
                            Create Account
                        </a>
                        <a href="/marketplace" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-11 px-8">
                            Browse Deals
                        </a>
                    </div>
                </div>
            </div>
        </div>
    )
}
