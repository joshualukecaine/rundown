import { NextRequest } from "next/server";
import { middleware } from "./middleware";

function makeRequest(pathname: string, cookies: Record<string, string> = {}): NextRequest {
  const url = new URL(pathname, "http://localhost:3000");
  const request = new NextRequest(url);
  for (const [key, value] of Object.entries(cookies)) {
    request.cookies.set(key, value);
  }
  return request;
}

describe("middleware", () => {
  it("should allow /login through without session", () => {
    const response = middleware(makeRequest("/login"));
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("should allow /api/auth/login through without session", () => {
    const response = middleware(makeRequest("/api/auth/login"));
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("should allow /api/auth/callback through without session", () => {
    const response = middleware(makeRequest("/api/auth/callback"));
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("should redirect to /login when no session cookie", () => {
    const response = middleware(makeRequest("/"));
    expect(response.status).toBe(307);
    expect(new URL(response.headers.get("location")!).pathname).toBe("/login");
  });

  it("should redirect /schedule to /login when no session cookie", () => {
    const response = middleware(makeRequest("/schedule"));
    expect(response.status).toBe(307);
    expect(new URL(response.headers.get("location")!).pathname).toBe("/login");
  });

  it("should redirect /api/events to /login when no session cookie", () => {
    const response = middleware(makeRequest("/api/events"));
    expect(response.status).toBe(307);
    expect(new URL(response.headers.get("location")!).pathname).toBe("/login");
  });

  it("should allow through when session cookie exists", () => {
    const response = middleware(makeRequest("/", { rundown_session: "encrypted-data" }));
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("should allow /schedule when session cookie exists", () => {
    const response = middleware(makeRequest("/schedule", { rundown_session: "encrypted-data" }));
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });
});
