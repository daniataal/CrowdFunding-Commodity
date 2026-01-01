"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { TrendingUp } from "lucide-react"

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/50 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-90">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-lg font-bold leading-none">CommodityFlow</div>
                <div className="hidden text-xs text-muted-foreground sm:block">Commodity crowdfunding, done right</div>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Button asChild variant="ghost">
              <Link href="/how-it-works">How it Works</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/marketplace">Marketplace</Link>
            </Button>
            <div className="mx-2 h-4 w-px bg-border hidden sm:block" />
            <Button asChild variant="outline" className="bg-transparent">
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20">
              <Link href="/register">Get started</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
