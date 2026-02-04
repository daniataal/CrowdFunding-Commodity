"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, TrendingUp, BarChart3, Users, Globe } from "lucide-react"
import Link from "next/link"

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Registration failed")
        return
      }

      // Redirect to login after successful registration
      router.push("/login?registered=true")
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

          <h1 className="mb-2 text-4xl font-bold tracking-tight text-foreground">Create account</h1>
          <p className="mb-8 text-muted-foreground text-lg">Start investing in commodities with institutional-grade tools</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                className="h-12 border-white/10 bg-white/5 px-4 transition-all focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/50"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="investor@example.com"
                className="h-12 border-white/10 bg-white/5 px-4 transition-all focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/50"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a strong password"
                className="h-12 border-white/10 bg-white/5 px-4 transition-all focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/50"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                minLength={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                className="h-12 border-white/10 bg-white/5 px-4 transition-all focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/50"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
                minLength={6}
              />
            </div>

            {error && (
              <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive font-medium">
                {error}
              </div>
            )}

            <Button type="submit" className="h-14 w-full bg-primary text-lg font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 hover:scale-[1.01] mt-2" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create account"
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground px-4">
              By creating an account, you agree to our Terms of Service and Privacy Policy
            </p>
          </form>

          <div className="mt-8 text-center text-sm text-muted-foreground">
            {"Already have an account?"}{" "}
            <Link href="/login" className="font-bold text-white hover:text-primary transition-colors">
              Sign in
            </Link>
          </div>
        </div>
      </div>

      {/* Right side - Visuals */}
      <div className="hidden lg:flex relative bg-[#050505] lg:w-1/2 lg:flex-col lg:justify-center lg:items-center lg:p-24 xl:p-32 overflow-hidden">
        {/* Abstract Background Effects */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-orange-600 rounded-full blur-[160px] opacity-5 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-primary rounded-full blur-[160px] opacity-10 pointer-events-none"></div>
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-5"></div>


        <div className="relative z-10 max-w-lg text-center">
          <h2 className="mb-6 text-5xl font-extrabold leading-tight text-white tracking-tight">
            Join Thousands<br />
            <span className="text-amber-500">of Investors</span>
          </h2>

          <p className="mb-12 text-lg text-neutral-400 font-medium max-w-md mx-auto">
            Get access to curated commodity investment opportunities with full transparency and low minimums.
          </p>

          <div className="grid grid-cols-3 gap-4 w-full">
            <div className="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-white/5 p-4 backdrop-blur-sm">
              <BarChart3 className="h-6 w-6 text-amber-500 mb-2" />
              <div className="text-2xl font-bold text-white">$2.4B</div>
              <div className="text-xs text-neutral-500">Assets Managed</div>
            </div>

            <div className="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-white/5 p-4 backdrop-blur-sm">
              <Users className="h-6 w-6 text-primary mb-2" />
              <div className="text-2xl font-bold text-white">12K+</div>
              <div className="text-xs text-neutral-500">Active Investors</div>
            </div>

            <div className="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-white/5 p-4 backdrop-blur-sm">
              <Globe className="h-6 w-6 text-emerald-500 mb-2" />
              <div className="text-2xl font-bold text-white">8.4%</div>
              <div className="text-xs text-neutral-500">Avg. Return</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
