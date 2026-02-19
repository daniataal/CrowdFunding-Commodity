"use client"

import Link from "next/link"
import { Separator } from "@/components/ui/separator"

export function PublicFooter() {
  return (
    <footer className="mt-14 border-t border-border bg-card/30 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col">
            <h1 className="text-xl font-black text-[#FF0000] tracking-tighter leading-none mb-1">RESERVEVAULT</h1>
            <p className="text-[8px] text-white/70 tracking-[0.2em] font-medium uppercase mb-4">Invest With Confidence</p>
            <div className="text-sm text-muted-foreground max-w-md">
              Fund real-world commodity shipments with institutional-grade transparency and verified lifecycle tracking.
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            <div className="space-y-2 text-sm">
              <div className="font-medium">Explore</div>
              <div>
                <Link className="text-muted-foreground hover:underline" href="/marketplace">
                  Marketplace
                </Link>
              </div>
              <div>
                <Link className="text-muted-foreground hover:underline" href="/login">
                  Login
                </Link>
              </div>
              <div>
                <Link className="text-muted-foreground hover:underline" href="/register">
                  Create account
                </Link>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="font-medium">Legal</div>
              <div>
                <Link className="text-muted-foreground hover:underline" href="/legal/terms">
                  Terms
                </Link>
              </div>
              <div>
                <Link className="text-muted-foreground hover:underline" href="/legal/privacy">
                  Privacy
                </Link>
              </div>
              <div>
                <Link className="text-muted-foreground hover:underline" href="/legal/risk-disclosure">
                  Risk disclosure
                </Link>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="font-medium">Support</div>
              <div className="text-muted-foreground">support@reservevault.com</div>
              <div className="text-muted-foreground">Mon–Fri, 9AM–6PM</div>
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} RESERVEVAULT. Institutional Trading Platform — not an offer to sell or solicit.
        </div>
      </div>
    </footer>
  )
}


