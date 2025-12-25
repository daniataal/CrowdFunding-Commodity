"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowUpRight, ArrowDownRight, Plus, Download, Wallet } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import type { WalletTransaction } from "@/lib/domain"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { toast } from "@/hooks/use-toast"

export function WalletView() {
  const qc = useQueryClient()
  const [depositOpen, setDepositOpen] = useState(false)
  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const [depositAmount, setDepositAmount] = useState("")
  const [depositReference, setDepositReference] = useState("")
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [withdrawDescription, setWithdrawDescription] = useState("")

  const balanceQuery = useQuery({
    queryKey: ["wallet", "balance"],
    queryFn: async () => {
      const res = await fetch("/api/wallet/balance")
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to load balance")
      return json.data.balance as number
    },
  })

  const transactionsQuery = useQuery({
    queryKey: ["wallet", "transactions"],
    queryFn: async () => {
      const res = await fetch("/api/wallet/transactions")
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to load transactions")
      return json.data as WalletTransaction[]
    },
  })

  const balance = balanceQuery.data ?? 0
  const txns = transactionsQuery.data ?? []

  const depositMutation = useMutation({
    mutationFn: async () => {
      const amount = Number.parseFloat(depositAmount)
      if (!Number.isFinite(amount) || amount <= 0) throw new Error("Enter a valid deposit amount")
      const res = await fetch("/api/wallet/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, reference: depositReference || undefined }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Deposit failed")
      return json
    },
    onSuccess: async () => {
      setDepositAmount("")
      setDepositReference("")
      setDepositOpen(false)
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["wallet", "balance"] }),
        qc.invalidateQueries({ queryKey: ["wallet", "transactions"] }),
        qc.invalidateQueries({ queryKey: ["dashboard", "summary"] }),
        qc.invalidateQueries({ queryKey: ["activity"] }),
      ])
      toast({ title: "Deposit complete", description: "Your wallet balance was updated." })
    },
  })

  const withdrawMutation = useMutation({
    mutationFn: async () => {
      const amount = Number.parseFloat(withdrawAmount)
      if (!Number.isFinite(amount) || amount <= 0) throw new Error("Enter a valid withdrawal amount")
      const res = await fetch("/api/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, description: withdrawDescription || undefined }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Withdrawal failed")
      return json
    },
    onSuccess: async () => {
      setWithdrawAmount("")
      setWithdrawDescription("")
      setWithdrawOpen(false)
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["wallet", "balance"] }),
        qc.invalidateQueries({ queryKey: ["wallet", "transactions"] }),
        qc.invalidateQueries({ queryKey: ["dashboard", "summary"] }),
        qc.invalidateQueries({ queryKey: ["activity"] }),
      ])
      toast({ title: "Withdrawal requested", description: "Your withdrawal was recorded as pending." })
    },
  })

  const totalInvested = txns
    .filter((t) => t.type === "INVESTMENT" && t.status === "COMPLETED")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0)

  const totalEarnings = txns
    .filter((t) => t.type === "DIVIDEND" && t.status === "COMPLETED")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0)

  return (
    <div className="space-y-6">
      {/* Wallet Summary */}
      <Card className="p-6 border-2 bg-card/50 backdrop-blur">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-sm text-muted-foreground font-medium">Available Balance</p>
            <h2 className="text-4xl font-bold mt-2">${balance.toLocaleString()}</h2>
          </div>
          <div className="h-14 w-14 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <Wallet className="h-7 w-7 text-amber-500" />
          </div>
        </div>
        <div className="flex gap-3">
          <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setDepositOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Deposit
          </Button>
          <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setWithdrawOpen(true)}>
            <Download className="h-4 w-4 mr-2" />
            Withdraw
          </Button>
        </div>
      </Card>

      {/* Transaction History */}
      <Card className="p-6 border-2 bg-card/50 backdrop-blur">
        <h3 className="text-lg font-semibold mb-4">Transaction History</h3>
        <div className="space-y-3">
          {txns.map((transaction) => {
            const isPositive = transaction.amount > 0
            const Icon = isPositive ? ArrowUpRight : ArrowDownRight

            return (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                      isPositive ? "bg-emerald-500/10" : "bg-red-500/10"
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${isPositive ? "text-emerald-500" : "text-red-500"}`} />
                  </div>
                  <div>
                    <p className="font-medium">{transaction.type}</p>
                    {transaction.commodity?.name && (
                      <p className="text-sm text-muted-foreground">{transaction.commodity.name}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${isPositive ? "text-emerald-500" : "text-foreground"}`}>
                    {isPositive ? "+" : ""}
                    {Math.abs(transaction.amount).toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(transaction.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6 border-2 bg-card/50 backdrop-blur">
          <p className="text-sm text-muted-foreground font-medium">Total Invested</p>
          <h3 className="text-2xl font-bold mt-2">${totalInvested.toLocaleString()}</h3>
          <p className="text-sm text-muted-foreground mt-1">Based on completed investment transactions</p>
        </Card>
        <Card className="p-6 border-2 bg-card/50 backdrop-blur">
          <p className="text-sm text-muted-foreground font-medium">Total Earnings</p>
          <h3 className="text-2xl font-bold mt-2 text-emerald-500">${totalEarnings.toLocaleString()}</h3>
          <p className="text-sm text-muted-foreground mt-1">From completed dividend transactions</p>
        </Card>
      </div>

      {/* Deposit dialog */}
      <Dialog open={depositOpen} onOpenChange={setDepositOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deposit funds</DialogTitle>
            <DialogDescription>Add money to your wallet balance.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="depositAmount">Amount</Label>
              <Input
                id="depositAmount"
                type="number"
                min="0"
                step="0.01"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="1000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="depositReference">Reference (optional)</Label>
              <Input
                id="depositReference"
                value={depositReference}
                onChange={(e) => setDepositReference(e.target.value)}
                placeholder="Bank transfer ref"
              />
            </div>
            {depositMutation.error && <div className="text-sm text-red-500">{(depositMutation.error as Error).message}</div>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDepositOpen(false)} className="bg-transparent">
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => depositMutation.mutate()}
              disabled={depositMutation.isPending}
            >
              {depositMutation.isPending ? "Depositing..." : "Confirm Deposit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Withdraw dialog */}
      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Withdraw funds</DialogTitle>
            <DialogDescription>Request a withdrawal from your wallet balance.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="withdrawAmount">Amount</Label>
              <Input
                id="withdrawAmount"
                type="number"
                min="0"
                step="0.01"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="withdrawDescription">Note (optional)</Label>
              <Input
                id="withdrawDescription"
                value={withdrawDescription}
                onChange={(e) => setWithdrawDescription(e.target.value)}
                placeholder="Where to send / notes"
              />
            </div>
            {withdrawMutation.error && <div className="text-sm text-red-500">{(withdrawMutation.error as Error).message}</div>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWithdrawOpen(false)} className="bg-transparent">
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => withdrawMutation.mutate()}
              disabled={withdrawMutation.isPending}
            >
              {withdrawMutation.isPending ? "Submitting..." : "Request Withdrawal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
