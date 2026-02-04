"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, TrendingUp, Sparkles, Shield, Zap } from "lucide-react"
import Link from "next/link"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError("Invalid email or password")
      } else {
        router.push("/")
        router.refresh()
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left side - Form */}
      <div className="flex w-full flex-col justify-center bg-background px-8 lg:w-1/2 lg:px-24 xl:px-32">
        <div className="w-full max-w-md mx-auto lg:mx-0">
          <div className="mb-10 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/30">
              <TrendingUp className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <span className="text-2xl font-bold tracking-tight text-foreground">CommodityFund</span>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Trade Like a Pro</p>
            </div>
          </div>

          <h1 className="mb-2 text-4xl font-bold tracking-tight text-foreground">Welcome back</h1>
          <p className="mb-8 text-muted-foreground text-lg">Sign in to access your commodity investment portfolio</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="investor@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-14 border-white/10 bg-white/5 px-4 text-base transition-all focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/50"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <Link href="/forgot-password" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-14 border-white/10 bg-white/5 px-4 text-base transition-all focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/50"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive font-medium">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="h-14 w-full bg-primary text-lg font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 hover:scale-[1.01]"
              disabled={isLoading}
            >
              {isLoading ? (
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
            <Link href="/register" className="font-bold text-white hover:text-primary transition-colors">
              Create account
            </Link>
          </div>
        </div>
      </div>

      {/* Right side - Marketing */}
      <div className="hidden lg:flex relative bg-[#050505] lg:w-1/2 items-center justify-center p-12 overflow-hidden">
        {/* Abstract Background Effects */}
        <div className="absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-primary rounded-full blur-[128px] opacity-10 pointer-events-none"></div>
        <div className="absolute bottom-1/4 left-1/4 w-[600px] h-[600px] bg-amber-600 rounded-full blur-[128px] opacity-5 pointer-events-none"></div>
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-5"></div>

        <div className="relative z-10 max-w-xl space-y-8">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-1.5 backdrop-blur-sm">
            <Sparkles className="h-4 w-4 text-amber-500 fill-amber-500/20" />
            <span className="text-sm font-semibold text-amber-500">Premium Trading Platform</span>
          </div>

          <h2 className="mb-6 text-6xl font-extrabold leading-tight text-white tracking-tight">
            Invest in Real<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">Commodities</span>
          </h2>

          <p className="mb-12 text-xl leading-relaxed text-neutral-400 font-medium">
            Access institutional-grade commodity investments with blockchain-backed transparency and fractional ownership.
          </p>

          <div className="space-y-4">
            <div className="group flex items-start gap-5 rounded-2xl border border-white/5 bg-white/5 p-5 transition-all hover:bg-white/10 hover:border-white/10">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 group-hover:scale-110 transition-transform">
                <Shield className="h-6 w-6 text-amber-500" />
              </div>
              <div className="space-y-1">
                <div className="font-bold text-white text-lg">Real Asset Backing</div>
                <div className="text-sm text-neutral-400 leading-relaxed">Every investment is fully backed by audited physical commodities stored in secure vaults.</div>
              </div>
            </div>

            <div className="group flex items-start gap-5 rounded-2xl border border-white/5 bg-white/5 p-5 transition-all hover:bg-white/10 hover:border-white/10">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 group-hover:scale-110 transition-transform">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-1">
                <div className="font-bold text-white text-lg">Instant Trading</div>
                <div className="text-sm text-neutral-400 leading-relaxed">Execute trades instantly with real-time market pricing and transparent fee structures.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
