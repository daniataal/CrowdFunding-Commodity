"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"
import { TrendingUp, Loader2, Sparkles, Shield, Zap } from "lucide-react"
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
      <div className="flex w-full flex-col justify-center bg-background px-8 lg:w-1/2 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-10 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/30">
              <TrendingUp className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <span className="text-2xl font-bold tracking-tight text-foreground">CommodityFund</span>
              <p className="text-xs text-muted-foreground">Trade Like a Pro</p>
            </div>
          </div>

          <h1 className="mb-2 text-4xl font-bold tracking-tight text-foreground">Welcome back</h1>
          <p className="mb-8 text-muted-foreground">Sign in to access your commodity investment portfolio</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="investor@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 border-border bg-secondary/50 px-4 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <button type="button" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
                  Forgot password?
                </button>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 border-border bg-secondary/50 px-4 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="h-12 w-full bg-primary font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/40"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>

          <div className="mt-8 text-center text-sm text-muted-foreground">
            {"Don't have an account?"}{" "}
            <button onClick={onSwitchToSignup} className="font-semibold text-primary hover:text-primary/80 transition-colors">
              Create account
            </button>
          </div>
        </div>
      </div>

      {/* Right side - Marketing */}
      <div className="relative hidden overflow-hidden bg-[#0a0a0a] lg:flex lg:w-1/2 lg:flex-col lg:justify-center lg:p-16">
        {/* Background texture */}
        <div className="absolute inset-0 bg-gradient-to-br from-black via-[#0a0a0a] to-[#151515]" />
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="noiseFilter"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" stitchTiles="stitch"/%3E%3C/filter%3E%3Crect width="100%" height="100%" filter="url(%23noiseFilter)"/%3E%3C/svg%3E")' }} />

        {/* Gold accent glow */}
        <div className="absolute right-0 top-1/4 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="absolute bottom-1/4 left-0 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-lg">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-medium text-amber-500">Premium Trading Platform</span>
          </div>

          <h2 className="mb-6 text-5xl font-bold leading-tight text-white">
            Invest in Real<br />
            <span className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">Commodities</span>
          </h2>
          <p className="mb-10 text-lg leading-relaxed text-neutral-400">
            Access institutional-grade commodity investments with blockchain-backed transparency and fractional ownership.
          </p>

          <div className="space-y-5">
            <div className="flex items-start gap-4 rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 backdrop-blur">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
                <Shield className="h-5 w-5 text-amber-500" />

              </div>
              <div>
                <div className="font-semibold text-white">Real Asset Backing</div>
                <div className="text-sm text-neutral-500">Every investment is backed by physical commodities</div>
              </div>
            </div>
            <div className="flex items-start gap-4 rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 backdrop-blur">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Zap className="h-5 w-5 text-primary" />
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
                <div className="font-semibold text-white">Instant Trading</div>
                ``             <div className="text-sm text-neutral-500">Real-time execution with transparent pricing</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div >
  )
}
