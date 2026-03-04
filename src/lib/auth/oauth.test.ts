import { buildAuthorizeUrl, exchangeCodeForToken, OAuthTokenError } from "./oauth";

function mockFetch(status: number, body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(typeof body === "string" ? body : JSON.stringify(body)),
  });
}

beforeEach(() => {
  process.env.RUNDOWN_CLIENT_ID = "240";
  process.env.RUNDOWN_SECRET = "test-secret";
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("buildAuthorizeUrl", () => {
  it("should include all required OAuth params", () => {
    const url = buildAuthorizeUrl("http://localhost:3000/api/auth/callback", "abc123");
    expect(url).toContain("https://intervals.icu/oauth/authorize?");
    expect(url).toContain("response_type=code");
    expect(url).toContain("client_id=240");
    expect(url).toContain("redirect_uri=http");
    expect(url).toContain("state=abc123");
  });

  it("should include all four scopes", () => {
    const url = buildAuthorizeUrl("http://localhost:3000/api/auth/callback", "state");
    expect(url).toContain("ACTIVITY");
    expect(url).toContain("CALENDAR");
    expect(url).toContain("WELLNESS");
    expect(url).toContain("SETTINGS");
  });
});

describe("exchangeCodeForToken", () => {
  it("should POST to the token endpoint with form-urlencoded body", async () => {
    const tokenData = {
      token_type: "Bearer",
      access_token: "abc123",
      scope: "ACTIVITY:READ",
      athlete: { id: "i219999", name: "Josh" },
    };
    const fetchMock = mockFetch(200, tokenData);
    vi.stubGlobal("fetch", fetchMock);

    const result = await exchangeCodeForToken("auth-code", "http://localhost:3000/api/auth/callback");

    expect(result).toEqual(tokenData);

    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://intervals.icu/api/oauth/token");
    expect(options.method).toBe("POST");

    const body = options.body as URLSearchParams;
    expect(body.get("grant_type")).toBe("authorization_code");
    expect(body.get("code")).toBe("auth-code");
    expect(body.get("client_id")).toBe("240");
    expect(body.get("client_secret")).toBe("test-secret");
    expect(body.get("redirect_uri")).toBe("http://localhost:3000/api/auth/callback");
  });

  it("should throw OAuthTokenError on non-OK response", async () => {
    vi.stubGlobal("fetch", mockFetch(422, "Invalid scope"));

    await expect(
      exchangeCodeForToken("bad-code", "http://localhost:3000/api/auth/callback"),
    ).rejects.toThrow(OAuthTokenError);
  });

  it("should include status and body in OAuthTokenError", async () => {
    vi.stubGlobal("fetch", mockFetch(401, "Unauthorized"));

    try {
      await exchangeCodeForToken("bad-code", "http://localhost:3000/api/auth/callback");
      expect.fail("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(OAuthTokenError);
      expect((err as OAuthTokenError).status).toBe(401);
      expect((err as OAuthTokenError).body).toBe("Unauthorized");
    }
  });
});
