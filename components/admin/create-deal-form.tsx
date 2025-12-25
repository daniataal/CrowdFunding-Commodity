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
import { COMMODITY_TEMPLATES, ICON_TO_IMAGE } from "@/lib/commodity-catalog"

export function CreateDealForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    templateKey: "",
    name: "",
    type: "",
    icon: "",
    risk: "",
    targetApy: "",
    duration: "",
    amountRequired: "",
    description: "",
    origin: "",
    destination: "",
    shipmentId: "",
    insuranceValue: "",
    transportMethod: "",
    riskScore: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/admin/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to create deal")
        return
      }

      router.push("/admin/deals")
      router.refresh()
    } catch (err) {
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card className="border-2">
        <CardHeader>
          <CardTitle>Deal Information</CardTitle>
          <CardDescription>Enter the details for the new commodity deal</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Commodity *</Label>
              <Select
                value={formData.templateKey}
                onValueChange={(value) => {
                  const t = COMMODITY_TEMPLATES.find((x) => x.key === value)
                  if (!t) return
                  setFormData({
                    ...formData,
                    templateKey: value,
                    name: t.name,
                    type: t.type,
                    icon: t.icon,
                    risk: t.risk ?? formData.risk,
                    targetApy: t.targetApy !== undefined ? String(t.targetApy) : formData.targetApy,
                    duration: t.duration !== undefined ? String(t.duration) : formData.duration,
                    insuranceValue: t.insuranceValue !== undefined ? String(t.insuranceValue) : formData.insuranceValue,
                    transportMethod: t.transportMethod ?? formData.transportMethod,
                  })
                }}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select commodity" />
                </SelectTrigger>
                <SelectContent>
                  {COMMODITY_TEMPLATES.map((t) => (
                    <SelectItem key={t.key} value={t.key}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.icon && (
                <div className="mt-2 flex items-center gap-3 rounded-lg border bg-muted/30 p-2">
                  <img
                    src={ICON_TO_IMAGE[formData.icon as keyof typeof ICON_TO_IMAGE]}
                    alt={formData.name}
                    className="h-10 w-10 rounded-md border bg-background p-1"
                  />
                  <div className="text-xs text-muted-foreground">
                    Listing image is auto-assigned for this commodity.
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Commodity Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
                required
                disabled={isLoading}
              >
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
              <Label htmlFor="risk">Risk Level *</Label>
              <Select
                value={formData.risk}
                onValueChange={(value) => setFormData({ ...formData, risk: value })}
                required
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select risk level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetApy">Target APY (%) *</Label>
              <Input
                id="targetApy"
                type="number"
                step="0.1"
                value={formData.targetApy}
                onChange={(e) => setFormData({ ...formData, targetApy: e.target.value })}
                required
                disabled={isLoading}
                placeholder="12.5"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (days) *</Label>
              <Input
                id="duration"
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                required
                disabled={isLoading}
                placeholder="45"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amountRequired">Amount Required ($) *</Label>
              <Input
                id="amountRequired"
                type="number"
                step="0.01"
                value={formData.amountRequired}
                onChange={(e) => setFormData({ ...formData, amountRequired: e.target.value })}
                required
                disabled={isLoading}
                placeholder="250000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="origin">Origin *</Label>
              <Input
                id="origin"
                value={formData.origin}
                onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                required
                disabled={isLoading}
                placeholder="São Paulo, Brazil"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="destination">Destination *</Label>
              <Input
                id="destination"
                value={formData.destination}
                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                required
                disabled={isLoading}
                placeholder="Rotterdam, Netherlands"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shipmentId">Shipment ID</Label>
              <Input
                id="shipmentId"
                value={formData.shipmentId}
                onChange={(e) => setFormData({ ...formData, shipmentId: e.target.value })}
                disabled={isLoading}
                placeholder="BRZ-CFE-2024-001"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="transportMethod">Transport Method</Label>
              <Input
                id="transportMethod"
                value={formData.transportMethod}
                onChange={(e) => setFormData({ ...formData, transportMethod: e.target.value })}
                disabled={isLoading}
                placeholder="Container Ship"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="insuranceValue">Insurance Value ($)</Label>
              <Input
                id="insuranceValue"
                type="number"
                step="0.01"
                value={formData.insuranceValue}
                onChange={(e) => setFormData({ ...formData, insuranceValue: e.target.value })}
                disabled={isLoading}
                placeholder="275000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="riskScore">Risk Score (0-10)</Label>
              <Input
                id="riskScore"
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={formData.riskScore}
                onChange={(e) => setFormData({ ...formData, riskScore: e.target.value })}
                disabled={isLoading}
                placeholder="3.5"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              disabled={isLoading}
              rows={4}
              placeholder="5000 bags of premium Arabica coffee beans from Brazilian highlands"
            />
          </div>

          <div className="flex gap-4">
            <Button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Deal"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}

