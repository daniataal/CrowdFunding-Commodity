"use client"

import { useActionState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Loader2, Sparkles, Shield, Zap } from "lucide-react"

import { authenticate } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function LoginPage() {
  const router = useRouter()
  const [errorMessage, dispatch, isPending] = useActionState(authenticate, undefined)

  return (
    <div className="flex min-h-screen">
      {/* Left side - Form */}
      <div className="flex w-full flex-col justify-center bg-background px-8 lg:w-1/2 lg:px-24 xl:px-32">
        {/* ... header ... */}

        <h1 className="mb-2 text-3xl font-bold tracking-tight text-foreground">Welcome back</h1>
        <p className="mb-6 text-muted-foreground text-base">Sign in to access your commodity investment portfolio</p>

        <form action={dispatch} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">Email</Label>
            <Input
              id="email"
              type="email"
              name="email"
              placeholder="investor@example.com"
              required
              className="h-11 border-white/10 bg-white/5 px-4 text-sm transition-all focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/50"
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
              name="password"
              placeholder="Enter your password"
              required
              className="h-11 border-white/10 bg-white/5 px-4 text-sm transition-all focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/50"
            />
          </div>

          {errorMessage && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive font-medium">
              {errorMessage}
            </div>
          )}

          <Button
            type="submit"
            className="h-11 w-full bg-primary text-base font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 hover:scale-[1.01]"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign in"
            )}
          </Button>
        </form>
        {/* ... footer ... */}
        {/* Footer link */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          {"Don't have an account?"}{" "}
          <Link href="/register" className="font-bold text-white hover:text-primary transition-colors">
            Create account
          </Link>
        </div>
      </div>

      {/* Right side - Marketing */}
      <div className="hidden lg:flex relative bg-[#050505] lg:w-1/2 items-center justify-center p-12 overflow-hidden">
        {/* Abstract Background Effects */}
        <div className="absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-primary rounded-full blur-[128px] opacity-10 pointer-events-none"></div>
        <div className="absolute bottom-1/4 left-1/4 w-[600px] h-[600px] bg-amber-600 rounded-full blur-[128px] opacity-5 pointer-events-none"></div>
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-5"></div>

        <div className="relative z-10 max-w-lg space-y-6">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 text-amber-500 fill-amber-500/20" />
            <span className="text-xs font-semibold text-amber-500">Premium Trading Platform</span>
          </div>

          <h2 className="mb-4 text-4xl font-extrabold leading-tight text-white tracking-tight">
            Invest in Real<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">Commodities</span>
          </h2>

          <p className="mb-8 text-lg leading-relaxed text-neutral-400 font-medium">
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
