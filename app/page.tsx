"use client"

import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { PublicLanding } from "@/components/public-landing"
import { PublicFooter } from "@/components/public-footer"
import { DashboardView } from "@/components/dashboard-view"
import { MarketplaceView } from "@/components/marketplace-view"
import { WalletView } from "@/components/wallet-view"
import { SettingsView } from "@/components/settings-view"
import { ActivityView } from "@/components/activity-view"
import { HelpView } from "@/components/help-view"
import { NotificationPanel } from "@/components/notification-panel"
import { OnboardingTour } from "@/components/onboarding-tour"
import { AssetDetailModal } from "@/components/asset-detail-modal"
import { ClientErrorBoundary } from "@/components/client-error-boundary"
import type { MarketplaceCommodity } from "@/lib/domain"
import {
  LayoutDashboard,
  Store,
  Wallet,
  Settings,
  Menu,
  X,
  LogOut,
  User,
  TrendingUp,
  Activity,
  HelpCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import { Shield as ShieldIcon } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import type { UserRole } from "@/lib/domain"

type View = "dashboard" | "marketplace" | "wallet" | "settings" | "activity" | "help"

export default function CommodityPlatform() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [currentView, setCurrentView] = useState<View>("dashboard")
  const [selectedAsset, setSelectedAsset] = useState<MarketplaceCommodity | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [settingsTab, setSettingsTab] = useState<"profile" | "security" | "notifications" | "preferences" | "billing">(
    "profile",
  )

  const user = session?.user

  // Don't rely solely on JWT session for role checks (it can be stale after DB changes).
  const profileRoleQuery = useQuery({
    queryKey: ["user", "profile", "role"],
    enabled: !!user,
    queryFn: async () => {
      const res = await fetch("/api/user/profile")
      if (!res.ok) return null
      const json = await res.json()
      return (json?.data?.role as UserRole | undefined) ?? null
    },
  })

  const effectiveRole = (profileRoleQuery.data ?? (user as any)?.role) as UserRole | null

  const handleLogout = async () => {
    await signOut({ redirect: false })
    router.push("/login")
  }

  // Check if user is new and should see onboarding
  useEffect(() => {
    if (user) {
      const hasSeenOnboarding = localStorage.getItem("hasSeenOnboarding")
      if (!hasSeenOnboarding) {
        setShowOnboarding(true)
      }
    }
  }, [user])

  // Show loading state
  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-primary" />
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    )
  }

  // Public landing experience for unauthenticated users (crowdfunding discovery).
  if (!user) {
    return (
      <>
        <PublicLanding />
        <PublicFooter />
      </>
    )
  }

  const handleCompleteOnboarding = () => {
    localStorage.setItem("hasSeenOnboarding", "true")
    setShowOnboarding(false)
  }

  const handleSkipOnboarding = () => {
    localStorage.setItem("hasSeenOnboarding", "true")
    setShowOnboarding(false)
  }

  const navigationItems = [
    { id: "dashboard" as View, label: "Dashboard", icon: LayoutDashboard },
    { id: "marketplace" as View, label: "Marketplace", icon: Store },
    { id: "wallet" as View, label: "Wallet", icon: Wallet },
    { id: "activity" as View, label: "Activity", icon: Activity },
  ]

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Global Background Effects */}
      <div className="fixed top-0 right-0 w-[800px] h-[800px] bg-primary rounded-full blur-[160px] opacity-5 pointer-events-none -z-10 translate-x-1/2 -translate-y-1/2"></div>
      <div className="fixed bottom-0 left-0 w-[800px] h-[800px] bg-amber-600 rounded-full blur-[160px] opacity-5 pointer-events-none -z-10 -translate-x-1/2 translate-y-1/2"></div>
      <div className="fixed inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.03] pointer-events-none -z-10"></div>

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/50 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <TrendingUp className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight">CommodityFund</h1>
                <p className="hidden text-xs text-muted-foreground sm:block">Trade Like a Pro</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden items-center gap-1 md:flex">
              {navigationItems.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentView(item.id)}
                    className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${currentView === item.id
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                      }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </button>
                )
              })}
            </nav>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentView("help")}
                className={currentView === "help" ? "bg-muted" : ""}
              >
                <HelpCircle className="h-5 w-5" />
              </Button>
              <NotificationPanel />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="hidden h-10 gap-2 md:flex">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} />
                      <AvatarFallback className="bg-primary/20 text-xs text-primary">
                        {user?.name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{user?.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{user?.name}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      setSettingsTab("profile")
                      setCurrentView("settings")
                    }}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setCurrentView("help")}>
                    <HelpCircle className="mr-2 h-4 w-4" />
                    Help & Support
                  </DropdownMenuItem>
                  {(effectiveRole === "ADMIN" || effectiveRole === "AUDITOR") && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/admin">
                          <ShieldIcon className="mr-2 h-4 w-4" />
                          {effectiveRole === "ADMIN" ? "Admin Portal" : "Audit Portal"}
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:text-red-500">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <nav className="space-y-1 pb-4 md:hidden">
              {navigationItems.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentView(item.id)
                      setMobileMenuOpen(false)
                    }}
                    className={`flex w-full items-center gap-2 rounded-lg px-4 py-2 transition-colors ${currentView === item.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                      }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                )
              })}
              <div className="border-t border-border pt-2">
                <button
                  onClick={() => {
                    setCurrentView("help")
                    setMobileMenuOpen(false)
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-4 py-2 transition-colors hover:bg-muted"
                >
                  <HelpCircle className="h-4 w-4" />
                  <span className="font-medium">Help & Support</span>
                </button>
                <button
                  onClick={() => {
                    setCurrentView("settings")
                    setMobileMenuOpen(false)
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-4 py-2 transition-colors hover:bg-muted"
                >
                  <Settings className="h-4 w-4" />
                  <span className="font-medium">Settings</span>
                </button>
                <button
                  onClick={() => {
                    handleLogout()
                    setMobileMenuOpen(false)
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-4 py-2 text-red-500 transition-colors hover:bg-muted"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            </nav>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <ClientErrorBoundary title="App view crashed">
          {currentView === "dashboard" && <DashboardView />}
          {currentView === "marketplace" && (
            <MarketplaceView
              onSelectAsset={(asset) => setSelectedAsset(asset)}
              canCreateListing={effectiveRole === "ADMIN"}
            />
          )}
          {currentView === "wallet" && <WalletView />}
          {currentView === "settings" && <SettingsView defaultTab={settingsTab} />}
          {currentView === "activity" && <ActivityView />}
          {currentView === "help" && <HelpView />}
        </ClientErrorBoundary>
      </main>

      {/* Asset Detail Modal */}
      <ClientErrorBoundary title="Listing details crashed">
        <AssetDetailModal
          commodity={selectedAsset}
          open={!!selectedAsset}
          onOpenChange={(open) => !open && setSelectedAsset(null)}
        />
      </ClientErrorBoundary>

      {/* Onboarding Tour */}
      {showOnboarding && <OnboardingTour onComplete={handleCompleteOnboarding} onSkip={handleSkipOnboarding} />}
    </div>
  )
}
