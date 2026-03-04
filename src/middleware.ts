import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow auth routes and login page through
  if (pathname.startsWith("/api/auth") || pathname === "/login") {
    return NextResponse.next();
  }

  // Check for session cookie (existence only — iron-session handles decryption server-side)
  const session = request.cookies.get("rundown_session");
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
