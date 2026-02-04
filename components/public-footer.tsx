"use client"

import Link from "next/link"
import { Separator } from "@/components/ui/separator"

export function PublicFooter() {
  return (
    <footer className="mt-14 border-t border-border bg-card/30 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="text-base font-semibold">CommodityFlow</div>
            <div className="mt-2 text-sm text-muted-foreground max-w-md">
              Fund real-world commodity shipments with verified documentation and transparent lifecycle tracking.
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
              <div className="text-muted-foreground">support@commodityflow.com</div>
              <div className="text-muted-foreground">Mon–Fri, 9AM–6PM</div>
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} CommodityFlow. Demo deployment — not an offer to sell or solicit.
        </div>
      </div>
    </footer>
  )
}


