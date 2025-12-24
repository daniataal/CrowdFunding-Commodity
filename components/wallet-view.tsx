"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { mockTransactions, mockPortfolio } from "@/lib/mock-data"
import { ArrowUpRight, ArrowDownRight, Plus, Download, Wallet } from "lucide-react"

export function WalletView() {
  return (
    <div className="space-y-6">
      {/* Wallet Summary */}
      <Card className="p-6 border-2 bg-card/50 backdrop-blur">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-sm text-muted-foreground font-medium">Available Balance</p>
            <h2 className="text-4xl font-bold mt-2">${mockPortfolio.cashInWallet.toLocaleString()}</h2>
          </div>
          <div className="h-14 w-14 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <Wallet className="h-7 w-7 text-amber-500" />
          </div>
        </div>
        <div className="flex gap-3">
          <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Deposit
          </Button>
          <Button variant="outline" className="flex-1 bg-transparent">
            <Download className="h-4 w-4 mr-2" />
            Withdraw
          </Button>
        </div>
      </Card>

      {/* Transaction History */}
      <Card className="p-6 border-2 bg-card/50 backdrop-blur">
        <h3 className="text-lg font-semibold mb-4">Transaction History</h3>
        <div className="space-y-3">
          {mockTransactions.map((transaction) => {
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
                    {transaction.commodity && <p className="text-sm text-muted-foreground">{transaction.commodity}</p>}
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${isPositive ? "text-emerald-500" : "text-foreground"}`}>
                    {isPositive ? "+" : ""}
                    {transaction.amount < 0 ? "" : ""}
                    {Math.abs(transaction.amount).toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">{transaction.date}</p>
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
          <h3 className="text-2xl font-bold mt-2">$120,000</h3>
          <p className="text-sm text-muted-foreground mt-1">Across 4 commodities</p>
        </Card>
        <Card className="p-6 border-2 bg-card/50 backdrop-blur">
          <p className="text-sm text-muted-foreground font-medium">Total Earnings</p>
          <h3 className="text-2xl font-bold mt-2 text-emerald-500">$21,370</h3>
          <p className="text-sm text-muted-foreground mt-1">From dividend payouts</p>
        </Card>
      </div>
    </div>
  )
}
