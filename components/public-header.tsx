"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { TrendingUp } from "lucide-react"

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-background/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-90">
              <div className="flex h-9 w-9 items-center justify-center rounded bg-primary">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-xl font-extrabold leading-none tracking-tight text-white">CommodityFlow</div>
                <div className="hidden text-[10px] uppercase font-bold tracking-widest text-primary sm:block">Gold Trading Platform</div>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <nav className="hidden md:flex gap-1">
              <Button asChild variant="ghost" className="text-sm font-medium text-muted-foreground hover:text-white">
                <Link href="/how-it-works">How it Works</Link>
              </Button>
              <Button asChild variant="ghost" className="text-sm font-medium text-muted-foreground hover:text-white">
                <Link href="/marketplace">Marketplace</Link>
              </Button>
            </nav>
            <div className="mx-2 h-4 w-px bg-white/10 hidden sm:block" />
            <Button asChild variant="ghost" className="text-white hover:bg-white/10 px-2 sm:px-4">
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild className="bg-primary hover:bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)] hover:shadow-[0_0_25px_rgba(239,68,68,0.6)] rounded-full px-4 sm:px-6 font-bold transition-all text-sm sm:text-base whitespace-nowrap">
              <Link href="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
