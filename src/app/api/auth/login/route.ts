import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { buildAuthorizeUrl } from "@/lib/auth/oauth";

export async function GET(request: NextRequest) {
  const state = crypto.randomBytes(16).toString("hex");
  const redirectUri = new URL("/api/auth/callback", request.nextUrl.origin).toString();

  const response = NextResponse.redirect(buildAuthorizeUrl(redirectUri, state));

  response.cookies.set("oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  return response;
}
