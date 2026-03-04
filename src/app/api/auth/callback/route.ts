import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { exchangeCodeForToken, OAuthTokenError } from "@/lib/auth/oauth";

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

  let data;
  try {
    data = await exchangeCodeForToken(code, redirectUri);
  } catch (err) {
    if (err instanceof OAuthTokenError) {
      console.error("Token exchange failed:", err.status, err.body);
    }
    return NextResponse.redirect(new URL("/login?error=token_failed", request.url));
  }

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
