import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth
  const userRole = req.auth?.user?.role

  // Admin routes protection
  if (pathname.startsWith("/admin")) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", req.url))
    }
    if (userRole !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url))
    }
  }

  // Redirect authenticated users away from auth pages
  if (isLoggedIn && (pathname.startsWith("/login") || pathname.startsWith("/register") || pathname.startsWith("/forgot-password"))) {
    return NextResponse.redirect(new URL("/", req.url))
  }

  // Protect main app routes (except auth pages)
  if (!isLoggedIn && !pathname.startsWith("/login") && !pathname.startsWith("/register") && !pathname.startsWith("/forgot-password") && !pathname.startsWith("/api") && pathname !== "/") {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}

