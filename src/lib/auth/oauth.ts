const AUTHORIZE_URL = "https://intervals.icu/oauth/authorize";
const TOKEN_URL = "https://intervals.icu/api/oauth/token";
const SCOPES = "ACTIVITY:READ,CALENDAR:READ,WELLNESS:READ,SETTINGS:READ";

export interface OAuthTokenResponse {
  token_type: string;
  access_token: string;
  scope: string;
  athlete: { id: string; name: string };
}

export class OAuthTokenError extends Error {
  constructor(
    public status: number,
    public body: string,
  ) {
    super(`Token exchange failed: ${status}`);
    this.name = "OAuthTokenError";
  }
}

/** Build the Intervals.icu OAuth authorize URL */
export function buildAuthorizeUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.RUNDOWN_CLIENT_ID!,
    redirect_uri: redirectUri,
    scope: SCOPES,
    state,
  });
  return `${AUTHORIZE_URL}?${params}`;
}

/** Exchange an authorization code for an access token */
export async function exchangeCodeForToken(
  code: string,
  redirectUri: string,
): Promise<OAuthTokenResponse> {
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.RUNDOWN_CLIENT_ID!,
      client_secret: process.env.RUNDOWN_SECRET!,
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new OAuthTokenError(response.status, body);
  }

  return response.json() as Promise<OAuthTokenResponse>;
}
