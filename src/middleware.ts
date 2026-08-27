import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE_NAME = "monitoring-session";

const JWT_SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-key-change-me"
);

/**
 * Middleware Next.js — proteksi route.
 *
 * Route yang TIDAK diproteksi:
 * - /login          → halaman login
 * - /api/auth/*     → API login/logout
 * - /_next/*        → Next.js internal
 * - /img/*          → static assets
 * - /favicon.ico    → favicon
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip routes yang tidak perlu diproteksi
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/img") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // Cek cookie session
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    // Belum login → redirect ke /login
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    // Verifikasi JWT token
    await jwtVerify(token, JWT_SECRET_KEY);
    return NextResponse.next();
  } catch {
    // Token expired atau invalid → redirect ke /login
    const response = NextResponse.redirect(new URL("/login", request.url));
    // Hapus cookie yang sudah tidak valid
    response.cookies.set(SESSION_COOKIE_NAME, "", {
      maxAge: 0,
      path: "/",
    });
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match semua route kecuali:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
