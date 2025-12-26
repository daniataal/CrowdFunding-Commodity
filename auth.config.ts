import type { NextAuthConfig } from "next-auth"

export const authConfig = {
  pages: {
    signIn: "/login",
    signOut: "/login",
    error: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnAuthPage = nextUrl.pathname.startsWith("/login") || 
                          nextUrl.pathname.startsWith("/register") ||
                          nextUrl.pathname.startsWith("/forgot-password")
      const isOnAdminPage = nextUrl.pathname.startsWith("/admin")
      const isOnPublicPage =
        nextUrl.pathname === "/" ||
        nextUrl.pathname.startsWith("/api") ||
        nextUrl.pathname.startsWith("/marketplace") ||
        nextUrl.pathname.startsWith("/legal")

      // Allow public API routes
      if (isOnPublicPage && nextUrl.pathname.startsWith("/api")) {
        return true
      }

      // Redirect authenticated users away from auth pages
      if (isLoggedIn && isOnAuthPage) {
        return Response.redirect(new URL("/", nextUrl))
      }

      // Protect admin routes
      if (isOnAdminPage) {
        if (!isLoggedIn) {
          return Response.redirect(new URL("/login", nextUrl))
        }
        // Check if user is admin (will be done in middleware)
        return true
      }

      // Protect all other routes
      if (!isLoggedIn && !isOnAuthPage && !isOnPublicPage) {
        return Response.redirect(new URL("/login", nextUrl))
      }

      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.kycStatus = user.kycStatus
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as any
        session.user.kycStatus = token.kycStatus as any
      }
      return session
    },
  },
  providers: [], // Add providers with an outer function
} satisfies NextAuthConfig

