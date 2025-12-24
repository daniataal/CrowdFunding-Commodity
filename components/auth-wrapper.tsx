"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { LoginForm } from "@/components/login-form"
import { SignupForm } from "@/components/signup-form"

interface AuthWrapperProps {
  children: React.ReactNode
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const { user, isLoading } = useAuth()
  const [showSignup, setShowSignup] = useState(false)

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-emerald-500" />
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    )
  }

  if (!user) {
    return showSignup ? (
      <SignupForm onSwitchToLogin={() => setShowSignup(false)} />
    ) : (
      <LoginForm onSwitchToSignup={() => setShowSignup(true)} />
    )
  }

  return <>{children}</>
}
