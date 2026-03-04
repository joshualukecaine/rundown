import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";

interface TokenResponse {
  token_type: string;
  access_token: string;
  scope: string;
  athlete: { id: string; name: string };
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL("/login?error=denied", request.url));
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL("/login?error=missing_params", request.url));
  }

  // Validate CSRF state
  const savedState = request.cookies.get("oauth_state")?.value;
  if (!savedState || savedState !== state) {
    return NextResponse.redirect(new URL("/login?error=invalid_state", request.url));
  }

  // Exchange code for token
  const redirectUri = new URL("/api/auth/callback", request.nextUrl.origin).toString();

  const tokenResponse = await fetch("https://intervals.icu/api/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: process.env.RUNDOWN_CLIENT_ID!,
      client_secret: process.env.RUNDOWN_SECRET!,
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!tokenResponse.ok) {
    const errorBody = await tokenResponse.text().catch(() => "");
    console.error("Token exchange failed:", tokenResponse.status, errorBody);
    return NextResponse.redirect(new URL("/login?error=token_failed", request.url));
  }

  const data = (await tokenResponse.json()) as TokenResponse;

  // Store in session
  const session = await getSession();
  session.accessToken = data.access_token;
  session.athleteId = data.athlete.id;
  session.athleteName = data.athlete.name;
  await session.save();

  // Clear the state cookie and redirect home
  const response = NextResponse.redirect(new URL("/", request.url));
  response.cookies.delete("oauth_state");
  return response;
}
