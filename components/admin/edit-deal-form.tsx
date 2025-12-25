"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

export function EditDealForm({
  dealId,
  initial,
}: {
  dealId: string
  initial: {
    name: string
    type: string
    risk: string
    targetApy: number
    duration: number
    amountRequired: number
    description: string
    origin: string
    destination: string
    shipmentId?: string | null
    insuranceValue?: number | null
    transportMethod?: string | null
    riskScore?: number | null
  }
}) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    name: initial.name,
    type: initial.type,
    risk: initial.risk,
    targetApy: String(initial.targetApy ?? ""),
    duration: String(initial.duration ?? ""),
    amountRequired: String(initial.amountRequired ?? ""),
    description: initial.description,
    origin: initial.origin,
    destination: initial.destination,
    shipmentId: initial.shipmentId ?? "",
    insuranceValue: initial.insuranceValue ?? "",
    transportMethod: initial.transportMethod ?? "",
    riskScore: initial.riskScore ?? "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const response = await fetch(`/api/admin/deals/${dealId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()
      if (!response.ok) {
        setError(data.error || "Failed to update deal")
        return
      }

      router.push(`/admin/deals/${dealId}`)
      router.refresh()
    } catch {
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card className="border-2">
        <CardHeader>
          <CardTitle>Edit Deal</CardTitle>
          <CardDescription>Update an existing commodity listing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Deal Name</Label>
              <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label>Commodity Type</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Agriculture">Agriculture</SelectItem>
                  <SelectItem value="Energy">Energy</SelectItem>
                  <SelectItem value="Metals">Metals</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Risk Level</Label>
              <Select value={formData.risk} onValueChange={(value) => setFormData({ ...formData, risk: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select risk" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetApy">Target APY (%)</Label>
              <Input
                id="targetApy"
                type="number"
                value={formData.targetApy}
                onChange={(e) => setFormData({ ...formData, targetApy: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (days)</Label>
              <Input
                id="duration"
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amountRequired">Amount Required ($)</Label>
              <Input
                id="amountRequired"
                type="number"
                value={formData.amountRequired}
                onChange={(e) => setFormData({ ...formData, amountRequired: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="origin">Origin</Label>
              <Input id="origin" value={formData.origin} onChange={(e) => setFormData({ ...formData, origin: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="destination">Destination</Label>
              <Input
                id="destination"
                value={formData.destination}
                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="shipmentId">Shipment ID (optional)</Label>
              <Input
                id="shipmentId"
                value={formData.shipmentId as any}
                onChange={(e) => setFormData({ ...formData, shipmentId: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="insuranceValue">Insurance Value (optional)</Label>
              <Input
                id="insuranceValue"
                type="number"
                value={formData.insuranceValue as any}
                onChange={(e) => setFormData({ ...formData, insuranceValue: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="transportMethod">Transport Method (optional)</Label>
              <Input
                id="transportMethod"
                value={formData.transportMethod as any}
                onChange={(e) => setFormData({ ...formData, transportMethod: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="riskScore">Risk Score (optional)</Label>
              <Input
                id="riskScore"
                type="number"
                value={formData.riskScore as any}
                onChange={(e) => setFormData({ ...formData, riskScore: e.target.value })}
              />
            </div>
          </div>

          <Button type="submit" disabled={isLoading} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </CardContent>
      </Card>
    </form>
  )
}


