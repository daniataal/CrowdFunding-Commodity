"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Upload, FileText, Shield } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function KycVerificationPage() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const [idFile, setIdFile] = useState<File | null>(null)
  const [addressFile, setAddressFile] = useState<File | null>(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleFileChange = (type: "id" | "address", file: File | null) => {
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("File size must be less than 5MB")
        return
      }
      if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
        setError("File must be an image or PDF")
        return
      }
      setError("")
    }

    if (type === "id") {
      setIdFile(file)
    } else {
      setAddressFile(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!idFile || !addressFile) {
      setError("Please upload both documents")
      return
    }

    setIsLoading(true)

    try {
      // Create form data
      const formData = new FormData()
      formData.append("idDocument", idFile)
      formData.append("addressDocument", addressFile)

      const response = await fetch("/api/kyc/upload", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to upload documents")
        return
      }

      setSuccess(true)
      // Update session to reflect KYC status change
      await update({ kycStatus: "PENDING" })
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push("/")
      }, 2000)
    } catch (err) {
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md border-2">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Documents Submitted</CardTitle>
            <CardDescription>Your KYC documents have been submitted for review</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center space-y-4 py-8">
              <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <Shield className="h-8 w-8 text-emerald-500" />
              </div>
              <p className="text-center text-sm text-muted-foreground">
                Your documents are under review. You'll be notified once the verification is complete.
              </p>
              <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">
                Pending Review
              </Badge>
            </div>
            <Button onClick={() => router.push("/")} className="w-full bg-emerald-600 hover:bg-emerald-700">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const kycStatus = session?.user?.kycStatus

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">KYC Verification</h1>
        <p className="text-muted-foreground">Upload your identification documents to verify your account</p>
      </div>

      {kycStatus === "APPROVED" && (
        <Alert className="mb-6 bg-emerald-500/10 border-emerald-500/20">
          <Shield className="h-4 w-4 text-emerald-500" />
          <AlertDescription className="text-emerald-500">
            Your KYC verification has been approved. You can now access all platform features.
          </AlertDescription>
        </Alert>
      )}

      {kycStatus === "PENDING" && (
        <Alert className="mb-6 bg-amber-500/10 border-amber-500/20">
          <Shield className="h-4 w-4 text-amber-500" />
          <AlertDescription className="text-amber-500">
            Your KYC documents are under review. We'll notify you once the verification is complete.
          </AlertDescription>
        </Alert>
      )}

      {kycStatus === "REJECTED" && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>
            Your KYC verification was rejected. Please upload new documents to try again.
          </AlertDescription>
        </Alert>
      )}

      <Card className="border-2">
        <CardHeader>
          <CardTitle>Upload Documents</CardTitle>
          <CardDescription>
            Please upload clear, readable copies of your identification documents. Accepted formats: JPG, PNG, PDF (Max
            5MB)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="idDocument">Government-Issued ID</Label>
                <p className="text-sm text-muted-foreground">
                  Driver's license, passport, or national ID card
                </p>
                <div className="flex items-center gap-4">
                  <Input
                    id="idDocument"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileChange("id", e.target.files?.[0] || null)}
                    disabled={isLoading || kycStatus === "APPROVED"}
                    className="flex-1"
                  />
                  {idFile && (
                    <Badge variant="outline" className="gap-2">
                      <FileText className="h-3 w-3" />
                      {idFile.name}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="addressDocument">Proof of Address</Label>
                <p className="text-sm text-muted-foreground">
                  Utility bill, bank statement, or government document (dated within last 3 months)
                </p>
                <div className="flex items-center gap-4">
                  <Input
                    id="addressDocument"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileChange("address", e.target.files?.[0] || null)}
                    disabled={isLoading || kycStatus === "APPROVED"}
                    className="flex-1"
                  />
                  {addressFile && (
                    <Badge variant="outline" className="gap-2">
                      <FileText className="h-3 w-3" />
                      {addressFile.name}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {kycStatus !== "APPROVED" && (
              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                disabled={isLoading || !idFile || !addressFile}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Submit Documents
                  </>
                )}
              </Button>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

