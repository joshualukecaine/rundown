import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function GET(request: NextRequest) {
  const state = crypto.randomBytes(16).toString("hex");

  const redirectUri = new URL("/api/auth/callback", request.nextUrl.origin).toString();

  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.RUNDOWN_CLIENT_ID!,
    redirect_uri: redirectUri,
    scope: "ACTIVITY:READ,CALENDAR:READ,WELLNESS:READ,SETTINGS:READ",
    state,
  });

  const response = NextResponse.redirect(
    `https://intervals.icu/oauth/authorize?${params}`,
  );

  // Store state in a short-lived cookie for CSRF validation
  response.cookies.set("oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 minutes
    path: "/",
  });

  return response;
}
