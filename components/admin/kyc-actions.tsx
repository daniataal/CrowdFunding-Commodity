"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

export function ApproveKycButton({ userId }: { userId: string }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleApprove = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/users/${userId}/kyc`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      })

      if (response.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error("Approve KYC error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      size="sm"
      variant="outline"
      className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20"
      onClick={handleApprove}
      disabled={isLoading}
    >
      {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Approve"}
    </Button>
  )
}

export function RejectKycButton({ userId }: { userId: string }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleReject = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/users/${userId}/kyc`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject" }),
      })

      if (response.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error("Reject KYC error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      size="sm"
      variant="outline"
      className="bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20"
      onClick={handleReject}
      disabled={isLoading}
    >
      {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Reject"}
    </Button>
  )
}

