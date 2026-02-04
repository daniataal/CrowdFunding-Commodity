"use client"

import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"

export function PayoutsForm({
  dealId,
  dealName,
  totalInvested,
  investorCount,
  dealStatus,
}: {
  dealId: string
  dealName: string
  totalInvested: number
  investorCount: number
  dealStatus: string
}) {
  const [totalPayout, setTotalPayout] = useState("")
  const [markSettled, setMarkSettled] = useState(true)
  const [force, setForce] = useState(false)
  const [idempotencyKey] = useState(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c = (globalThis as any).crypto
    return c?.randomUUID ? c.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`
  })

  const mutation = useMutation({
    mutationFn: async () => {
      const n = Number.parseFloat(totalPayout)
      if (!Number.isFinite(n) || n <= 0) throw new Error("Enter a valid total payout amount")
      const res = await fetch(`/api/admin/deals/${dealId}/payouts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
        body: JSON.stringify({ totalPayout: n, markSettled, force }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Payout distribution failed")
      return json.data as { investors: number; investments: number; totalInvested: number; totalPayout: number }
    },
  })

  return (
    <div className="space-y-4">
      <Card className="border-border p-6 bg-card relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-[60px] pointer-events-none" />
        <div className="relative z-10">
          <div className="text-lg font-semibold text-foreground">Distribute Payouts</div>
          <div className="text-sm text-muted-foreground">
            Pro-rata distribution across {investorCount.toLocaleString()} investors. Executed atomically in one DB
            transaction.
          </div>

          {dealStatus !== "RELEASED" && (
            <Alert className="mt-4 border-amber-500/20 bg-amber-500/10">
              <AlertDescription className="text-amber-500">
                Deal status is <span className="font-medium">{dealStatus}</span>. Payouts are normally distributed after{" "}
                <span className="font-medium">RELEASED</span>.
              </AlertDescription>
            </Alert>
          )}

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Total invested</Label>
              <div className="font-medium text-foreground">${totalInvested.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
            </div>
            <div className="space-y-2">
              <Label>Deal</Label>
              <div className="font-medium text-foreground">{dealName}</div>
            </div>
          </div>

          <div className="mt-6 space-y-2">
            <Label htmlFor="totalPayout">Total payout pool ($)</Label>
            <Input
              id="totalPayout"
              type="number"
              step="0.01"
              value={totalPayout}
              onChange={(e) => setTotalPayout(e.target.value)}
              placeholder="e.g. 525000"
              className="bg-background border-border"
            />
            <div className="flex items-start gap-3 pt-2">
              <Checkbox checked={markSettled} onCheckedChange={(v) => setMarkSettled(Boolean(v))} className="border-border data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground" />
              <div className="text-sm text-foreground">
                Mark deal as <span className="font-medium">SETTLED</span> after distribution.
              </div>
            </div>
            <div className="flex items-start gap-3 pt-2">
              <Checkbox checked={force} onCheckedChange={(v) => setForce(Boolean(v))} className="border-border data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground" />
              <div className="text-sm text-foreground">
                Force payout even if deal is not <span className="font-medium">ARRIVED</span> (admin override).
              </div>
            </div>
          </div>

          {mutation.error && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{(mutation.error as Error).message}</AlertDescription>
            </Alert>
          )}

          {mutation.data && (
            <Alert className="mt-4 border-emerald-500/20 bg-emerald-500/10">
              <AlertDescription className="text-emerald-500">
                Distributed ${mutation.data.totalPayout.toLocaleString()} across {mutation.data.investors.toLocaleString()}{" "}
                investors.
              </AlertDescription>
            </Alert>
          )}

          <div className="mt-6 flex gap-2">
            <Button
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20"
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending || (dealStatus !== "RELEASED" && !force)}
            >
              {mutation.isPending ? "Distributing..." : "Distribute Payouts"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}


