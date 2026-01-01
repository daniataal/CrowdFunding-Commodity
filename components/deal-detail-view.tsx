"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useSession } from "next-auth/react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { CommodityDocument, DocumentType, MarketplaceCommodity } from "@/lib/domain"
import { DollarSign, TrendingUp, MapPin, Truck, FileText, Shield, Calendar, Link as LinkIcon } from "lucide-react"
import { ShipmentMap } from "@/components/shipment-map"
import type { ShipmentEvent } from "@/lib/domain"
import { MetalsValueCalculator } from "@/components/metals-value-calculator"

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

function fundedPct(current: number, required: number) {
  return required > 0 ? (current / required) * 100 : 0
}

export function DealDetailView({ commodity }: { commodity: MarketplaceCommodity }) {
  const { data: session } = useSession()
  const qc = useQueryClient()
  const [investAmount, setInvestAmount] = useState("")
  const [ackRisk, setAckRisk] = useState(false)
  const [ackTerms, setAckTerms] = useState(false)
  const [detailsTab, setDetailsTab] = useState<"financials" | "logistics" | "documents">("financials")

  const commodityId = commodity.id
  const fundedPercentage = fundedPct(commodity.currentAmount, commodity.amountRequired)
  const remainingAmount = commodity.amountRequired - commodity.currentAmount
  const minInvestment = commodity.minInvestment ?? 1000
  const maxInvestment = commodity.maxInvestment ?? null
  const platformFeeBps = commodity.platformFeeBps ?? 150
  const hasCoords =
    commodity.originLat != null && commodity.originLng != null && commodity.destLat != null && commodity.destLng != null

  const arrivalDate = useMemo(() => {
    if (commodity.maturityDate) return new Date(commodity.maturityDate)
    return new Date(Date.now() + commodity.duration * 24 * 60 * 60 * 1000)
  }, [commodity.maturityDate, commodity.duration])

  const departureDate = useMemo(() => {
    // If we have an explicit maturity date, infer departure by subtracting duration.
    if (commodity.maturityDate) {
      const d = new Date(commodity.maturityDate)
      return new Date(d.getTime() - commodity.duration * 24 * 60 * 60 * 1000)
    }
    return new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
  }, [commodity.maturityDate, commodity.duration])

  const transport = String(commodity.transportMethod ?? "").toLowerCase()
  const vehicleType =
    commodity.type === "Metals" && (transport.includes("brink") || transport.includes("armored"))
      ? "armored"
      : commodity.type === "Metals" && (transport.includes("air") || transport.includes("jet") || transport.includes("plane"))
        ? "plane"
        : commodity.type === "Metals"
          ? "plane"
          : transport.includes("air") || transport.includes("plane")
            ? "plane"
            : "ship"
  const vesselName = commodity.shipmentId ?? `${commodity.name} ${vehicleType === "plane" ? "Jet" : "Vessel"}`

  const kycStatus = (session?.user as any)?.kycStatus as string | undefined
  const isAuthed = !!session?.user
  const kycApproved = kycStatus === "APPROVED"

  const docsQuery = useQuery({
    queryKey: ["commodities", commodityId, "documents"],
    queryFn: async () => {
      const res = await fetch(`/api/commodities/${commodityId}/documents`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to load documents")
      return json.data as CommodityDocument[]
    },
  })

  const shipmentEventsQuery = useQuery({
    queryKey: ["commodities", commodityId, "shipment-events"],
    queryFn: async () => {
      const res = await fetch(`/api/commodities/${commodityId}/shipment-events`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to load shipment events")
      return json.data as ShipmentEvent[]
    },
  })

  const { effectiveDepartureDate, effectiveArrivalDate } = useMemo(() => {
    const events = shipmentEventsQuery.data ?? []
    const departed = events.find((e) => e.type === "DEPARTED")
    const arrived = [...events].reverse().find((e) => e.type === "ARRIVED")
    const now = new Date()
    const arrivedAt = arrived ? new Date(arrived.occurredAt) : null
    const arrivedPast = Boolean(arrivedAt && arrivedAt <= now)
    return {
      effectiveDepartureDate: departed ? new Date(departed.occurredAt) : departureDate,
      effectiveArrivalDate: arrived ? new Date(arrived.occurredAt) : arrivalDate,
    }
  }, [shipmentEventsQuery.data, departureDate, arrivalDate])

  const projectedReturn = useMemo(() => {
    const amount = Number.parseFloat(investAmount)
    if (!Number.isFinite(amount) || amount <= 0) return "0.00"
    const value = amount * (Number(commodity.targetApy ?? 0) / 100) * (Number(commodity.duration ?? 0) / 365)
    return value.toFixed(2)
  }, [investAmount, commodity.targetApy, commodity.duration])

  const amountNum = Number.parseFloat(investAmount)
  const isAmountValid = Number.isFinite(amountNum) && amountNum > 0
  const fee = isAmountValid ? (amountNum * platformFeeBps) / 10000 : 0
  const totalDebit = isAmountValid ? amountNum + fee : 0
  const minViolation = isAmountValid && amountNum < minInvestment
  const maxViolation = isAmountValid && maxInvestment !== null && amountNum > maxInvestment
  const remainingViolation = isAmountValid && amountNum > remainingAmount

  const investMutation = useMutation({
    mutationFn: async () => {
      const amount = Number.parseFloat(investAmount)
      if (!Number.isFinite(amount) || amount <= 0) throw new Error("Enter a valid amount")
      if (amount < minInvestment) throw new Error(`Minimum investment is $${minInvestment.toLocaleString()}`)
      if (maxInvestment !== null && amount > maxInvestment) throw new Error(`Maximum investment is $${maxInvestment.toLocaleString()}`)
      if (amount > remainingAmount) throw new Error("Investment exceeds remaining funding amount")
      if (!ackRisk || !ackTerms) throw new Error("Please accept the Risk Disclosure and Terms to continue")
      const idem =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (globalThis as any).crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`
      const res = await fetch("/api/invest", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": idem },
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
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["marketplace", "commodities"] }),
        qc.invalidateQueries({ queryKey: ["public", "marketplace", "commodities"] }),
        qc.invalidateQueries({ queryKey: ["wallet", "balance"] }),
        qc.invalidateQueries({ queryKey: ["wallet", "transactions"] }),
        qc.invalidateQueries({ queryKey: ["dashboard", "summary"] }),
        qc.invalidateQueries({ queryKey: ["dashboard", "shipments"] }),
        qc.invalidateQueries({ queryKey: ["activity"] }),
        qc.invalidateQueries({ queryKey: ["commodities", commodityId] }),
      ])
    },
  })

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-sm text-muted-foreground">
            <Link className="underline" href="/marketplace">
              Marketplace
            </Link>{" "}
            / Deal
          </div>
          <h1 className="mt-2 text-3xl font-bold">{commodity.name}</h1>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="outline">{commodity.type}</Badge>
            <Badge variant="outline">{commodity.risk} Risk</Badge>
            <Badge variant="outline">{commodity.status}</Badge>
          </div>
        </div>
        {commodity.status !== "FUNDING" && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="bg-transparent"
              onClick={() => {
                setDetailsTab("logistics")
                setTimeout(() => {
                  document.getElementById("logistics-map")?.scrollIntoView({ behavior: "smooth", block: "start" })
                }, 0)
              }}
            >
              Track Shipment
            </Button>
          </div>
        )}
        {!isAuthed && (
          <div className="flex gap-2">
            <Button asChild variant="outline" className="bg-transparent">
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Link href="/register">Create account</Link>
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card className="border-2 bg-card/50 backdrop-blur p-6">
            <div className="text-sm text-muted-foreground">{commodity.description}</div>
            <div className="mt-5 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Funding Progress</span>
                <span className="font-semibold">{fundedPercentage.toFixed(0)}%</span>
              </div>
              <Progress value={fundedPercentage} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>${commodity.currentAmount.toLocaleString()}</span>
                <span>of ${commodity.amountRequired.toLocaleString()}</span>
              </div>
            </div>
          </Card>

          <Tabs value={detailsTab} onValueChange={(v) => setDetailsTab(v as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="financials">Financials</TabsTrigger>
              <TabsTrigger value="logistics">Logistics</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>

            <TabsContent value="financials" className="space-y-4 mt-4">
              <Card className="p-6 border-2">
                <h3 className="font-semibold mb-4 flex items-center">
                  <DollarSign className="h-5 w-5 mr-2 text-emerald-500" />
                  Deal financials
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
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-muted-foreground">Insurance Coverage</span>
                    <span className="font-semibold">
                      {commodity.insuranceValue ? `$${commodity.insuranceValue.toLocaleString()}` : "—"}
                    </span>
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

              {commodity.type === "Metals" && (
                <MetalsValueCalculator
                  grossWeightTroyOz={commodity.grossWeightTroyOz ?? null}
                  purityPercent={commodity.purityPercent ?? null}
                  metalLabel={commodity.name}
                />
              )}
            </TabsContent>

            <TabsContent value="logistics" className="space-y-4 mt-4">
              <Card id="logistics-map" className="p-6 border-2">
                <h3 className="font-semibold mb-4">Logistics Map</h3>
                {hasCoords ? (
                  <ShipmentMap
                    originCoordinates={{ lat: commodity.originLat as number, lng: commodity.originLng as number }}
                    destinationCoordinates={{ lat: commodity.destLat as number, lng: commodity.destLng as number }}
                    departureDate={effectiveDepartureDate}
                    arrivalDate={effectiveArrivalDate}
                    vesselName={vesselName}
                    vehicleType={vehicleType}
                  />
                ) : (
                  <div className="text-sm text-muted-foreground">
                    This deal is missing coordinates. Add origin/destination coordinates in the Admin deal editor to
                    enable map tracking.
                  </div>
                )}
                <div className="mt-4 space-y-2">
                  {shipmentEventsQuery.isError ? (
                    <div className="text-sm text-muted-foreground">
                      {(shipmentEventsQuery.error as Error).message === "Unauthorized" ? (
                        <span>
                          Please <Link className="underline" href="/login">log in</Link> to view shipment tracking.
                        </span>
                      ) : (shipmentEventsQuery.error as Error).message === "KYC approval required" ? (
                        <span>
                          KYC approval is required to view shipment tracking.{" "}
                          <Link className="underline" href="/kyc-verification">Complete verification</Link>.
                        </span>
                      ) : (
                        <span>Shipment events unavailable.</span>
                      )}
                    </div>
                  ) : null}

                  {(() => {
                    const events = shipmentEventsQuery.data ?? []
                    const departed = events.find((e) => e.type === "DEPARTED")
                    const arrived = [...events].reverse().find((e) => e.type === "ARRIVED")
                    const now = new Date()
                    const departedAt = departed ? new Date(departed.occurredAt) : departureDate
                    const arrivedAt = arrived ? new Date(arrived.occurredAt) : arrivalDate
                    const arrivedPast = Boolean(arrived && arrivedAt <= now)
                    const inTransitState = now < departedAt ? "Pending" : arrivedPast ? "Completed" : "Active"
                    return (
                      <>
                        <div className="flex items-center justify-between text-sm">
                          <div className="font-medium">Departed {commodity.origin}</div>
                          <div className="text-muted-foreground">{departedAt.toLocaleDateString()}</div>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <div className="font-medium">Currently in transit</div>
                          <div className="text-muted-foreground">{inTransitState}</div>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <div className="font-medium">
                            {arrivedPast ? "Arrived" : "Estimated arrival"} {commodity.destination}
                          </div>
                          <div className="text-muted-foreground">{arrivedAt.toLocaleDateString()}</div>
                        </div>
                      </>
                    )
                  })()}
                </div>
              </Card>

              <Card className="p-6 border-2">
                <h3 className="font-semibold mb-4 flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-amber-500" />
                  Shipping route
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
                  Shipping manifest
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipment ID</span>
                    <code className="text-sm bg-muted px-2 py-1 rounded">{commodity.shipmentId ?? "—"}</code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Transport Method</span>
                    <span className="font-semibold">{commodity.transportMethod ?? "—"}</span>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="documents" className="space-y-4 mt-4">
              {docsQuery.isLoading ? (
                <Card className="p-6 border-2 text-sm text-muted-foreground">Loading documents…</Card>
              ) : docsQuery.isError ? (
                <Card className="p-6 border-2 text-sm text-muted-foreground">
                  {(docsQuery.error as Error).message === "Unauthorized" ? (
                    <span>
                      Please <Link className="underline" href="/login">log in</Link> to view verified deal documents.
                    </span>
                  ) : (docsQuery.error as Error).message === "KYC approval required" ? (
                    <span>
                      KYC approval is required to view verified deal documents.{" "}
                      <Link className="underline" href="/kyc-verification">Complete verification</Link>.
                    </span>
                  ) : (
                    <span>Failed to load documents.</span>
                  )}
                </Card>
              ) : (docsQuery.data?.length ?? 0) === 0 ? (
                <Card className="p-6 border-2 text-sm text-muted-foreground">No verified documents available yet.</Card>
              ) : (
                <div className="space-y-3">
                  {(docsQuery.data ?? []).map((d) => {
                    const Icon = docIcon(d.type)
                    return (
                      <a
                        key={d.id}
                        href={d.url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={async (e) => {
                          // Convert signed-url endpoint → expiring download link.
                          if (!d.url.startsWith("/api/documents/")) return
                          e.preventDefault()
                          const res = await fetch(d.url)
                          const json = await res.json()
                          if (!res.ok) throw new Error(json.error || "Failed to get download link")
                          window.open(json.data.url, "_blank", "noopener,noreferrer")
                        }}
                      >
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
        </div>

        <div className="space-y-4">
          <Card className="border-2 bg-card/50 backdrop-blur p-6">
            <h3 className="font-semibold mb-4 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-emerald-500" />
              Invest
            </h3>

            {!isAuthed && (
              <Alert className="mb-4">
                <AlertDescription>
                  Please <Link className="underline" href="/login">log in</Link> to invest.
                </AlertDescription>
              </Alert>
            )}

            {isAuthed && !kycApproved && (
              <Alert className="mb-4 border-amber-500/20 bg-amber-500/10">
                <AlertDescription className="text-amber-500">
                  KYC approval is required before investing.{" "}
                  <Link className="underline" href="/kyc-verification">
                    Complete verification
                  </Link>
                  .
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div>
                <Label htmlFor="amount">Investment Amount ($)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="10000"
                  value={investAmount}
                  onChange={(e) => setInvestAmount(e.target.value)}
                  className="mt-2"
                  disabled={!isAuthed || !kycApproved}
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

              <div className="rounded-lg border p-4">
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

              <div className="space-y-3 rounded-lg border p-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={ackRisk}
                    onCheckedChange={(v) => setAckRisk(Boolean(v))}
                    disabled={!isAuthed || !kycApproved}
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
                    disabled={!isAuthed || !kycApproved}
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

              {investMutation.error && <div className="text-sm text-red-500">{(investMutation.error as Error).message}</div>}

              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                size="lg"
                onClick={() => investMutation.mutate()}
                disabled={
                  !isAuthed ||
                  !kycApproved ||
                  investMutation.isPending ||
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
        </div>
      </div>
    </div>
  )
}


