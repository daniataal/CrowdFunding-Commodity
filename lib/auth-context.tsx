"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect } from "react"

interface User {
  id: string
  email: string
  name: string
  avatar?: string
  role: "investor" | "admin"
  createdAt: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, name: string) => Promise<void>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for existing session
    const storedUser = localStorage.getItem("commodity_user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    // Mock login - replace with actual API call
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const mockUser: User = {
      id: "1",
      email,
      name: email.split("@")[0],
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
      role: "investor",
      createdAt: new Date().toISOString(),
    }

    setUser(mockUser)
    localStorage.setItem("commodity_user", JSON.stringify(mockUser))
    setIsLoading(false)
  }

  const signup = async (email: string, password: string, name: string) => {
    // Mock signup - replace with actual API call
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const mockUser: User = {
      id: Date.now().toString(),
      email,
      name,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
      role: "investor",
      createdAt: new Date().toISOString(),
    }

    setUser(mockUser)
    localStorage.setItem("commodity_user", JSON.stringify(mockUser))
    setIsLoading(false)
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("commodity_user")
  }

  return <AuthContext.Provider value={{ user, login, signup, logout, isLoading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
