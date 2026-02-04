import type { NextAuthConfig } from "next-auth"

export const authConfig = {
  secret: process.env.AUTH_SECRET,
  trustHost: true,
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
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.kycStatus = user.kycStatus
        token.avatar = (user as any).avatar ?? null
      }

      // When calling `useSession().update(data)`, merge the provided fields into the token
      // (no DB lookups here, because this config is also used by edge middleware).
      if (trigger === "update") {
        const updateSession = (session ?? {}) as any
        if (updateSession.role !== undefined) token.role = updateSession.role
        if (updateSession.kycStatus !== undefined) token.kycStatus = updateSession.kycStatus
        if (updateSession.avatar !== undefined) token.avatar = updateSession.avatar
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as any
        session.user.kycStatus = token.kycStatus as any
          ; (session.user as any).avatar = (token as any).avatar ?? null
      }
      return session
    },
  },
  providers: [], // Add providers with an outer function
} satisfies NextAuthConfig

