"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { MapPin, FileText, DollarSign, TrendingUp, Shield, Truck, Calendar, Link as LinkIcon } from "lucide-react"
import type { CommodityDocument, DocumentType, MarketplaceCommodity } from "@/lib/domain"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { useSession } from "next-auth/react"

interface AssetDetailModalProps {
  commodity: MarketplaceCommodity | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const typeLabels: Record<DocumentType, string> = {
  BILL_OF_LADING: "Bill of Lading",
  INSURANCE_CERTIFICATE: "Insurance Certificate",
  QUALITY_CERTIFICATION: "Quality Certification",
  COMMODITY_CONTRACT: "Commodity Contract",
  KYC_ID: "KYC ID",
  KYC_PROOF_OF_ADDRESS: "KYC Proof of Address",
  OTHER: "Other",
}

function docIcon(type: DocumentType) {
  switch (type) {
    case "INSURANCE_CERTIFICATE":
      return Shield
    case "COMMODITY_CONTRACT":
      return Calendar
    default:
      return FileText
  }
}

export function AssetDetailModal({ commodity, open, onOpenChange }: AssetDetailModalProps) {
  const [investAmount, setInvestAmount] = useState("")
  const [ackRisk, setAckRisk] = useState(false)
  const [ackTerms, setAckTerms] = useState(false)
  const qc = useQueryClient()
  const { data: session } = useSession()
  const commodityId = commodity?.id

  const docsQuery = useQuery({
    queryKey: ["commodities", commodityId, "documents"],
    enabled: !!commodityId && open,
    queryFn: async () => {
      const res = await fetch(`/api/commodities/${commodityId}/documents`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to load documents")
      return json.data as CommodityDocument[]
    },
  })

  const fundedPercentage =
    commodity && commodity.amountRequired > 0 ? (commodity.currentAmount / commodity.amountRequired) * 100 : 0
  const remainingAmount = commodity ? commodity.amountRequired - commodity.currentAmount : 0
  const minInvestment = commodity?.minInvestment ?? 1000
  const maxInvestment = commodity?.maxInvestment ?? null
  const platformFeeBps = commodity?.platformFeeBps ?? 150
  const projectedReturn = investAmount
    ? (
        Number.parseFloat(investAmount) *
        (Number(commodity?.targetApy ?? 0) / 100) *
        (Number(commodity?.duration ?? 0) / 365)
      ).toFixed(2)
    : "0.00"

  const amountNum = Number.parseFloat(investAmount)
  const isAmountValid = Number.isFinite(amountNum) && amountNum > 0
  const fee = isAmountValid ? (amountNum * platformFeeBps) / 10000 : 0
  const totalDebit = isAmountValid ? amountNum + fee : 0
  const minViolation = isAmountValid && amountNum < minInvestment
  const maxViolation = isAmountValid && maxInvestment !== null && amountNum > maxInvestment
  const remainingViolation = isAmountValid && amountNum > remainingAmount

  const investMutation = useMutation({
    mutationFn: async () => {
      if (!commodityId) throw new Error("No commodity selected")
      const amount = Number.parseFloat(investAmount)
      if (!Number.isFinite(amount) || amount <= 0) throw new Error("Enter a valid amount")
      if (amount < minInvestment) throw new Error(`Minimum investment is $${minInvestment.toLocaleString()}`)
      if (maxInvestment !== null && amount > maxInvestment) throw new Error(`Maximum investment is $${maxInvestment.toLocaleString()}`)
      if (amount > remainingAmount) throw new Error("Investment exceeds remaining funding amount")
      const kycStatus = (session?.user as any)?.kycStatus as string | undefined
      if (kycStatus !== "APPROVED") throw new Error("KYC approval is required before investing")
      if (!ackRisk || !ackTerms) throw new Error("Please accept the Risk Disclosure and Terms to continue")
      const res = await fetch("/api/invest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commodityId, amount, ackRisk: true, ackTerms: true }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Investment failed")
      return json
    },
    onSuccess: async () => {
      setInvestAmount("")
      setAckRisk(false)
      setAckTerms(false)
      onOpenChange(false)
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["marketplace", "commodities"] }),
        qc.invalidateQueries({ queryKey: ["wallet", "balance"] }),
        qc.invalidateQueries({ queryKey: ["wallet", "transactions"] }),
        qc.invalidateQueries({ queryKey: ["dashboard", "summary"] }),
        qc.invalidateQueries({ queryKey: ["dashboard", "shipments"] }),
        qc.invalidateQueries({ queryKey: ["activity"] }),
      ])
    },
  })

  const kycApproved = (session?.user as any)?.kycStatus === "APPROVED"

  return (
    <Dialog open={open && !!commodity} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        {!commodity ? (
          <div className="py-8 text-sm text-muted-foreground">Select a marketplace deal to view details.</div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl">{commodity.name}</DialogTitle>
              <div className="flex gap-2 mt-2">
                <Badge variant="outline">{commodity.type}</Badge>
                <Badge
                  variant="outline"
                  className={
                    commodity.risk === "Low"
                      ? "border-emerald-500/50 text-emerald-500"
                      : commodity.risk === "Medium"
                        ? "border-amber-500/50 text-amber-500"
                        : "border-red-500/50 text-red-500"
                  }
                >
                  {commodity.risk} Risk
                </Badge>
              </div>
            </DialogHeader>

            <Tabs defaultValue="financials" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="financials">Financials</TabsTrigger>
            <TabsTrigger value="logistics">Logistics</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="financials" className="space-y-4 mt-4">
            <Card className="p-6 border-2">
              <h3 className="font-semibold mb-4 flex items-center">
                <DollarSign className="h-5 w-5 mr-2 text-emerald-500" />
                Cost Breakdown
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Required</span>
                  <span className="font-semibold">${commodity.amountRequired.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Already Funded</span>
                  <span className="font-semibold text-emerald-500">${commodity.currentAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Remaining</span>
                  <span className="font-semibold">${remainingAmount.toLocaleString()}</span>
                </div>
                <Progress value={fundedPercentage} className="h-2" />
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-muted-foreground">Insurance Coverage</span>
                  <span className="font-semibold">${commodity.insuranceValue?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Target APY</span>
                  <span className="font-semibold text-emerald-500">{commodity.targetApy}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-semibold">{commodity.duration} days</span>
                </div>
              </div>
            </Card>

            <Card className="p-6 border-2 bg-emerald-500/5">
              <h3 className="font-semibold mb-4 flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-emerald-500" />
                Investment Calculator
              </h3>
              <div className="space-y-4">
                {!kycApproved && (
                  <Alert className="border-amber-500/20 bg-amber-500/10">
                    <AlertDescription className="text-amber-500">
                      KYC approval is required before investing.{" "}
                      <Link className="underline" href="/kyc-verification">
                        Complete verification
                      </Link>
                      .
                    </AlertDescription>
                  </Alert>
                )}
                <div>
                  <Label htmlFor="amount">Investment Amount ($)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="10000"
                    value={investAmount}
                    onChange={(e) => setInvestAmount(e.target.value)}
                    className="mt-2"
                    disabled={!kycApproved}
                  />
                  <div className="mt-2 text-xs text-muted-foreground">
                    Min ${minInvestment.toLocaleString()}
                    {maxInvestment !== null ? ` • Max $${maxInvestment.toLocaleString()}` : ""} • Remaining $
                    {remainingAmount.toLocaleString()}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 p-4 bg-background rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Projected Return</p>
                    <p className="text-2xl font-bold text-emerald-500">${projectedReturn}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Value</p>
                    <p className="text-2xl font-bold">
                      $
                      {investAmount
                        ? (Number.parseFloat(investAmount) + Number.parseFloat(projectedReturn)).toFixed(2)
                        : "0.00"}
                    </p>
                  </div>
                </div>
                <div className="rounded-lg border p-4 bg-background/50">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Platform fee</span>
                    <span className="font-medium">{(platformFeeBps / 100).toFixed(2)}%</span>
                  </div>
                  <div className="mt-2 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Principal</span>
                      <span className="font-medium">${isAmountValid ? amountNum.toFixed(2) : "0.00"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fee</span>
                      <span className="font-medium">${fee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-muted-foreground">Total wallet debit</span>
                      <span className="font-semibold">${totalDebit.toFixed(2)}</span>
                    </div>
                  </div>
                  {(minViolation || maxViolation || remainingViolation) && (
                    <div className="mt-2 text-xs text-red-500">
                      {minViolation && `Below minimum ($${minInvestment.toLocaleString()}). `}
                      {maxViolation && maxInvestment !== null && `Above maximum ($${maxInvestment.toLocaleString()}). `}
                      {remainingViolation && "Exceeds remaining funding."}
                    </div>
                  )}
                </div>
                <div className="space-y-3 rounded-lg border p-4 bg-background/50">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={ackRisk}
                      onCheckedChange={(v) => setAckRisk(Boolean(v))}
                      disabled={!kycApproved}
                      aria-label="Acknowledge risk disclosure"
                    />
                    <div className="text-sm">
                      I have read and understand the{" "}
                      <Link className="underline" href="/legal/risk-disclosure" target="_blank">
                        Risk Disclosure
                      </Link>
                      .
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={ackTerms}
                      onCheckedChange={(v) => setAckTerms(Boolean(v))}
                      disabled={!kycApproved}
                      aria-label="Accept terms of service"
                    />
                    <div className="text-sm">
                      I agree to the{" "}
                      <Link className="underline" href="/legal/terms" target="_blank">
                        Terms of Service
                      </Link>
                      .
                    </div>
                  </div>
                </div>
                {investMutation.error && (
                  <div className="text-sm text-red-500">{(investMutation.error as Error).message}</div>
                )}
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  size="lg"
                  onClick={() => investMutation.mutate()}
                  disabled={
                    investMutation.isPending ||
                    !kycApproved ||
                    !ackRisk ||
                    !ackTerms ||
                    !isAmountValid ||
                    minViolation ||
                    maxViolation ||
                    remainingViolation
                  }
                >
                  {investMutation.isPending ? "Investing..." : "Invest Now"}
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="logistics" className="space-y-4 mt-4">
            <Card className="p-6 border-2">
              <h3 className="font-semibold mb-4 flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-amber-500" />
                Shipping Route
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-3 w-3 rounded-full bg-emerald-500" />
                  <div>
                    <p className="font-semibold">Origin</p>
                    <p className="text-sm text-muted-foreground">{commodity.origin}</p>
                  </div>
                </div>
                <div className="ml-1.5 h-12 w-0.5 bg-border" />
                <div className="flex items-center gap-4">
                  <div className="h-3 w-3 rounded-full border-2 border-foreground" />
                  <div>
                    <p className="font-semibold">Destination</p>
                    <p className="text-sm text-muted-foreground">{commodity.destination}</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6 border-2">
              <h3 className="font-semibold mb-4 flex items-center">
                <Truck className="h-5 w-5 mr-2 text-amber-500" />
                Shipping Manifest
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipment ID</span>
                  <code className="text-sm bg-muted px-2 py-1 rounded">{commodity.shipmentId}</code>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Transport Method</span>
                  <span className="font-semibold">{commodity.transportMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estimated Duration</span>
                  <span className="font-semibold">{commodity.duration} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Insurance Provider</span>
                  <span className="font-semibold">Lloyd's of London</span>
                </div>
              </div>
            </Card>

            <div className="bg-muted/50 rounded-lg p-4 flex items-start gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Route Optimization</p>
                <p className="text-sm text-muted-foreground mt-1">
                  This shipment follows the most efficient trade route with minimal transit time and optimal customs
                  clearance.
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="documents" className="space-y-4 mt-4">
            {docsQuery.isLoading ? (
              <Card className="p-6 border-2 text-sm text-muted-foreground">Loading documents…</Card>
            ) : (docsQuery.data?.length ?? 0) === 0 ? (
              <Card className="p-6 border-2 text-sm text-muted-foreground">No verified documents available yet.</Card>
            ) : (
              <div className="space-y-3">
                {(docsQuery.data ?? []).map((d) => {
                  const Icon = docIcon(d.type)
                  return (
                    <a key={d.id} href={d.url} target="_blank" rel="noreferrer">
                      <Card className="p-6 border-2 hover:border-primary/50 transition-colors cursor-pointer">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Icon className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold truncate">{d.name}</h4>
                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                              {typeLabels[d.type]}
                              <span className="inline-flex items-center gap-1">
                                <LinkIcon className="h-4 w-4" />
                                Open
                              </span>
                            </p>
                          </div>
                          <Badge className="bg-emerald-600">Verified</Badge>
                        </div>
                      </Card>
                    </a>
                  )
                })}
              </div>
            )}
          </TabsContent>
            </Tabs>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
