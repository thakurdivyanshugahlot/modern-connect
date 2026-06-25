// src/middleware.ts
import { NextRequest, NextResponse } from "next/server";

export function proxy(req: NextRequest) {
  const isAuthRoute = req.nextUrl.pathname.startsWith("/api/auth");
  const isPublic = req.nextUrl.pathname === "/";

  const sessionCookie =
    req.cookies.get("better-auth.session_token") ??
    req.cookies.get("__Secure-better-auth.session_token");

  if (!sessionCookie && !isAuthRoute && !isPublic) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/gmail/:path*", "/dashboard/:path*"],
};