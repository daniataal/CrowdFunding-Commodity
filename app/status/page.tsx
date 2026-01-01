"use client"

import { PublicHeader } from "@/components/public-header"
import { PublicFooter } from "@/components/public-footer"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, AlertCircle } from "lucide-react"

export default function StatusPage() {
    const systems = [
        { name: "Database Operations", status: "operational" },
        { name: "API Gateway", status: "operational" },
        { name: "User Authentication", status: "operational" },
        { name: "Payment Processing", status: "operational" },
        { name: "Document Verification", status: "operational" },
        { name: "Email Notifications", status: "operational" },
    ]

    return (
        <div className="min-h-screen bg-background">
            <PublicHeader />
            <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold mb-2">System Status</h1>
                    <p className="text-muted-foreground">Real-time status of CommodityFlow services.</p>
                </div>

                <Card className="border-2 p-6 mb-8 bg-emerald-500/5 border-emerald-500/20">
                    <div className="flex items-center gap-4">
                        <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                        <div>
                            <div className="font-semibold text-lg">All Systems Operational</div>
                            <p className="text-sm text-muted-foreground">We are not currently experiencing any issues.</p>
                        </div>
                    </div>
                </Card>

                <div className="grid gap-3">
                    {systems.map((sys, i) => (
                        <Card key={i} className="p-4 flex items-center justify-between border bg-card/50">
                            <span className="font-medium">{sys.name}</span>
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20">
                                <CheckCircle2 className="mr-1 h-3 w-3" /> Operational
                            </Badge>
                        </Card>
                    ))}
                </div>
            </main>
            <PublicFooter />
        </div>
    )
}
