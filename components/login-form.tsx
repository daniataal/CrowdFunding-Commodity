"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"
import { TrendingUp, Loader2 } from "lucide-react"
import Link from "next/link"

interface LoginFormProps {
  onSwitchToSignup: () => void
}

export function LoginForm({ onSwitchToSignup }: LoginFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      await login(email, password)
    } catch (err) {
      setError("Invalid credentials. Please try again.")
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

          <h1 className="mb-2 text-3xl font-bold text-foreground">Welcome back</h1>
          <p className="mb-8 text-muted-foreground">Sign in to access your commodity investment portfolio</p>

          <form onSubmit={handleSubmit} className="space-y-4">
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
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="/forgot-password" className="text-sm text-emerald-500 hover:text-emerald-400">
                  Forgot password?
                </Link>
              </div>
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

            {error && <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-500">{error}</div>}

            <Button
              type="submit"
              className="h-11 w-full bg-emerald-600 text-white hover:bg-emerald-500"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <button onClick={onSwitchToSignup} className="font-medium text-emerald-500 hover:text-emerald-400">
              Sign up
            </button>
          </div>
        </div>
      </div>

      {/* Right side - Marketing */}
      <div className="hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 lg:flex lg:w-1/2 lg:flex-col lg:justify-center lg:p-16">
        <div className="mx-auto max-w-lg">
          <h2 className="mb-4 text-4xl font-bold text-white">Invest in Real Commodities</h2>
          <p className="mb-8 text-lg text-slate-300">
            Access institutional-grade commodity investments with blockchain-backed transparency and fractional
            ownership.
          </p>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
              </div>
              <div>
                <div className="font-semibold text-white">Real Asset Backing</div>
                <div className="text-sm text-slate-400">Every investment is backed by physical commodities</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
              </div>
              <div>
                <div className="font-semibold text-white">Transparent Trading</div>
                <div className="text-sm text-slate-400">Real-time tracking and blockchain verification</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
              </div>
              <div>
                <div className="font-semibold text-white">Low Minimum Investment</div>
                <div className="text-sm text-slate-400">Start investing from $1,000</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
