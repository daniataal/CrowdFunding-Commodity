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
}: {
  dealId: string
  dealName: string
  totalInvested: number
  investorCount: number
}) {
  const [totalPayout, setTotalPayout] = useState("")
  const [markSettled, setMarkSettled] = useState(true)

  const mutation = useMutation({
    mutationFn: async () => {
      const n = Number.parseFloat(totalPayout)
      if (!Number.isFinite(n) || n <= 0) throw new Error("Enter a valid total payout amount")
      const res = await fetch(`/api/admin/deals/${dealId}/payouts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ totalPayout: n, markSettled }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Payout distribution failed")
      return json.data as { investors: number; investments: number; totalInvested: number; totalPayout: number }
    },
  })

  return (
    <div className="space-y-4">
      <Card className="border-2 p-6">
        <div className="text-lg font-semibold">Distribute Payouts</div>
        <div className="text-sm text-muted-foreground">
          Pro-rata distribution across {investorCount.toLocaleString()} investors. Executed atomically in one DB
          transaction.
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Total invested</Label>
            <div className="font-medium">${totalInvested.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
          </div>
          <div className="space-y-2">
            <Label>Deal</Label>
            <div className="font-medium">{dealName}</div>
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
          />
          <div className="flex items-start gap-3 pt-2">
            <Checkbox checked={markSettled} onCheckedChange={(v) => setMarkSettled(Boolean(v))} />
            <div className="text-sm">
              Mark deal as <span className="font-medium">SETTLED</span> after distribution.
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
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Distributing..." : "Distribute Payouts"}
          </Button>
        </div>
      </Card>
    </div>
  )
}


