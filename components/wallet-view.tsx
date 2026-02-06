"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowUpRight, ArrowDownRight, Plus, Download, Wallet, TrendingUp, Sparkles } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import type { WalletTransaction } from "@/lib/domain"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { toast } from "@/hooks/use-toast"

function makeIdempotencyKey() {
  // Browser support: prefer crypto.randomUUID; fallback for older environments.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c = (globalThis as any).crypto
  if (c?.randomUUID) return c.randomUUID()
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

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
      const idem = makeIdempotencyKey()
      const res = await fetch("/api/wallet/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": idem },
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
      const idem = makeIdempotencyKey()
      const res = await fetch("/api/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": idem },
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
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Wallet</h1>
        <p className="text-muted-foreground mt-1">Manage your funds and view transaction history</p>
      </div>

      {/* Main Balance Card */}
      <Card className="relative overflow-hidden border border-white/10 bg-[#0A0A0A] p-8 rounded-2xl">
        {/* Background Decorative Blob */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/20 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-amber-500/10 rounded-full blur-[80px] pointer-events-none translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10">
          <div className="flex justify-between items-start mb-12">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Available Balance</p>
              <h2 className="text-5xl font-bold text-white tracking-tight">${balance.toLocaleString()}</h2>
              <p className="text-sm text-emerald-400 mt-2 font-medium">Ready to invest</p>
            </div>

            <div className="h-16 w-16 rounded-2xl bg-[#151515] border border-white/5 flex items-center justify-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <Wallet className="h-8 w-8 text-amber-500 relative z-10" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button
              className="h-14 text-base font-bold bg-primary hover:bg-red-600 text-white shadow-lg shadow-red-500/20 rounded-xl border-none"
              onClick={() => setDepositOpen(true)}
            >
              <Plus className="h-5 w-5 mr-2" />
              Deposit
            </Button>
            <Button
              variant="outline"
              className="h-14 text-base font-bold border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-xl"
              onClick={() => setWithdrawOpen(true)}
            >
              <Download className="h-5 w-5 mr-2" />
              Withdraw
            </Button>
          </div>
        </div>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-8 border border-white/10 bg-[#0A0A0A] rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/20 rounded-full blur-[60px] transition-all duration-500 group-hover:bg-red-500/30" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="h-5 w-5 text-red-400" />
              <p className="text-sm font-medium text-muted-foreground">Total Invested</p>
            </div>
            <h3 className="text-3xl font-bold text-white">${totalInvested.toLocaleString()}</h3>
            <p className="text-sm text-muted-foreground mt-1">Across various commodities</p>
          </div>
        </Card>

        <Card className="p-8 border border-white/10 bg-[#0A0A0A] rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/20 rounded-full blur-[60px] transition-all duration-500 group-hover:bg-amber-500/30" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="h-5 w-5 text-amber-400" />
              <p className="text-sm font-medium text-muted-foreground">Total Earnings</p>
            </div>
            <h3 className="text-3xl font-bold text-amber-400">${totalEarnings.toLocaleString()}</h3>
            <p className="text-sm text-muted-foreground mt-1">From dividend payouts</p>
          </div>
        </Card>
      </div>

      {/* Transaction History */}
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-bold text-white">Transaction History</h3>
          <p className="text-sm text-muted-foreground">Your recent wallet activity</p>
        </div>

        <div className="space-y-3">
          {txns.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-white/10 rounded-xl">
              <p className="text-muted-foreground">No transactions yet.</p>
            </div>
          ) : (
            txns.map((transaction) => {
              const isPositive = transaction.amount > 0
              const Icon = isPositive ? ArrowUpRight : ArrowDownRight

              return (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-5 rounded-xl border border-white/5 bg-[#0A0A0A] hover:bg-white/[0.02] transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`h-12 w-12 rounded-xl flex items-center justify-center transition-colors ${isPositive
                        ? "bg-emerald-500/10 group-hover:bg-emerald-500/20"
                        : "bg-red-500/10 group-hover:bg-red-500/20"
                        }`}
                    >
                      <Icon className={`h-5 w-5 ${isPositive ? "text-emerald-400" : "text-red-400"}`} />
                    </div>
                    <div>
                      <div className="font-bold text-white text-base">
                        {transaction.type === "DIVIDEND" && "Dividend Payout"}
                        {transaction.type === "INVESTMENT" && "Investment"}
                        {transaction.type === "DEPOSIT" && "Deposit"}
                        {transaction.type === "WITHDRAWAL" && "Withdrawal"}
                        {transaction.type === "REFUND" && "Refund"}
                        {transaction.type === "PAYOUT" && "Payout"}
                        {!["DIVIDEND", "INVESTMENT", "DEPOSIT", "WITHDRAWAL", "REFUND", "PAYOUT"].includes(transaction.type) &&
                          transaction.type.charAt(0) + transaction.type.slice(1).toLowerCase().replace(/_/g, " ")}
                      </div>
                      {transaction.commodity?.name ? (
                        <p className="text-sm text-muted-foreground">{transaction.commodity.name}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          {new Date(transaction.createdAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-lg ${isPositive ? "text-emerald-400" : "text-white"}`}>
                      {isPositive ? "+" : ""}
                      ${Math.abs(transaction.amount).toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Deposit/Withdraw Dialogs */}
      <Dialog open={depositOpen} onOpenChange={setDepositOpen}>
        <DialogContent className="bg-[#0A0A0A] border-white/10 sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-white">Deposit funds</DialogTitle>
            <DialogDescription>Add money to your wallet balance.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="depositAmount" className="text-white">Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-muted-foreground">$</span>
                <Input
                  id="depositAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="1000"
                  className="pl-7 bg-white/5 border-white/10 text-white h-12"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="depositReference" className="text-white">Reference (optional)</Label>
              <Input
                id="depositReference"
                value={depositReference}
                onChange={(e) => setDepositReference(e.target.value)}
                placeholder="Bank transfer ref"
                className="bg-white/5 border-white/10 text-white h-12"
              />
            </div>
            {depositMutation.error && <div className="text-sm text-red-500 bg-red-500/10 p-3 rounded-lg border border-red-500/20">{(depositMutation.error as Error).message}</div>}
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDepositOpen(false)} className="bg-transparent border-white/10 text-white hover:bg-white/10 h-11">
              Cancel
            </Button>
            <Button
              className="bg-primary hover:bg-red-600 text-white font-bold h-11"
              onClick={() => depositMutation.mutate()}
              disabled={depositMutation.isPending}
            >
              {depositMutation.isPending ? "Depositing..." : "Confirm Deposit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent className="bg-[#0A0A0A] border-white/10 sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-white">Withdraw funds</DialogTitle>
            <DialogDescription>Request a withdrawal from your wallet balance.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="withdrawAmount" className="text-white">Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-muted-foreground">$</span>
                <Input
                  id="withdrawAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="500"
                  className="pl-7 bg-white/5 border-white/10 text-white h-12"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="withdrawDescription" className="text-white">Note (optional)</Label>
              <Input
                id="withdrawDescription"
                value={withdrawDescription}
                onChange={(e) => setWithdrawDescription(e.target.value)}
                placeholder="Where to send / notes"
                className="bg-white/5 border-white/10 text-white h-12"
              />
            </div>
            {withdrawMutation.error && <div className="text-sm text-red-500 bg-red-500/10 p-3 rounded-lg border border-red-500/20">{(withdrawMutation.error as Error).message}</div>}
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setWithdrawOpen(false)} className="bg-transparent border-white/10 text-white hover:bg-white/10 h-11">
              Cancel
            </Button>
            <Button
              className="bg-primary hover:bg-red-600 text-white font-bold h-11"
              onClick={() => withdrawMutation.mutate()}
              disabled={withdrawMutation.isPending}
            >
              {withdrawMutation.isPending ? "Submitting..." : "Withdraw Funds"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
