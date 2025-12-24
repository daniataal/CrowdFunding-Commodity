"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"
import { TrendingUp, Loader2 } from "lucide-react"

interface SignupFormProps {
  onSwitchToLogin: () => void
}

export function SignupForm({ onSwitchToLogin }: SignupFormProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { signup } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    setLoading(true)

    try {
      await signup(email, password, name)
    } catch (err) {
      setError("Failed to create account. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left side - Form */}
      <div className="flex w-full flex-col justify-center px-8 lg:w-1/2 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-foreground">CommodityFlow</span>
          </div>

          <h1 className="mb-2 text-3xl font-bold text-foreground">Create your account</h1>
          <p className="mb-8 text-muted-foreground">Start investing in commodities with institutional-grade tools</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="investor@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="h-11"
              />
            </div>

            {error && <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-500">{error}</div>}

            <Button
              type="submit"
              className="h-11 w-full bg-emerald-600 text-white hover:bg-emerald-500"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create account"
              )}
            </Button>

            <p className="text-xs text-muted-foreground">
              By creating an account, you agree to our Terms of Service and Privacy Policy
            </p>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <button onClick={onSwitchToLogin} className="font-medium text-emerald-500 hover:text-emerald-400">
              Sign in
            </button>
          </div>
        </div>
      </div>

      {/* Right side - Marketing */}
      <div className="hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 lg:flex lg:w-1/2 lg:flex-col lg:justify-center lg:p-16">
        <div className="mx-auto max-w-lg">
          <h2 className="mb-4 text-4xl font-bold text-white">Join Thousands of Investors</h2>
          <p className="mb-8 text-lg text-slate-300">
            Get access to curated commodity investment opportunities with full transparency and low minimums.
          </p>
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
              <div className="mb-1 text-2xl font-bold text-white">$2.4B</div>
              <div className="text-xs text-slate-400">Assets Under Management</div>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
              <div className="mb-1 text-2xl font-bold text-white">12K+</div>
              <div className="text-xs text-slate-400">Active Investors</div>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
              <div className="mb-1 text-2xl font-bold text-white">8.4%</div>
              <div className="text-xs text-slate-400">Avg. Annual Return</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
