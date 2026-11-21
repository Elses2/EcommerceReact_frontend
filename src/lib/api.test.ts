/**
 * Unit tests for the API client (`src/lib/api.ts`).
 * Mocks `fetch`; no network calls in unit tests.
 *
 * @spec (spec §23.2, §23.4)
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { api, configureApiClient, NetworkError, UnauthorizedError, ValidationError } from "./api";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockFetch(response: {
  ok: boolean;
  status: number;
  headers: Record<string, string>;
  body?: unknown;
}): void {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
    ok: response.ok,
    status: response.status,
    headers: new Headers(response.headers),
    json: () => Promise.resolve(response.body),
    text: () => Promise.resolve(String(response.body ?? "")),
  } as unknown as Response));
}

function mockFetchNetworkError(): void {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
}

function getFetchMock(): ReturnType<typeof vi.fn> {
  return globalThis.fetch as ReturnType<typeof vi.fn>;
}

beforeEach(() => {
  vi.clearAllMocks();
  // Reset the unauthorized handler to default (window.location redirect)
  configureApiClient((path: string) => {
    window.location.href = `/login?next=${encodeURIComponent(path)}`;
  });
});

// ---------------------------------------------------------------------------
// GET
// ---------------------------------------------------------------------------

describe("api.get", () => {
  it("returns parsed JSON on 200", async () => {
    mockFetch({ ok: true, status: 200, headers: { "content-type": "application/json" }, body: { id: 1, name: "Test", email: "test@example.com", role: "customer" } });
    const result = await api.get<{ id: number }>("/auth/me");
    expect(result).toEqual({ id: 1, name: "Test", email: "test@example.com", role: "customer" });
  });

  it("throws UnauthorizedError on 401 and triggers redirect", async () => {
    mockFetch({ ok: false, status: 401, headers: { "content-type": "application/json" }, body: { error: "Unauthorized" } });
    const redirectSpy = vi.fn();
    configureApiClient(redirectSpy);

    await expect(api.get("/auth/me")).rejects.toThrow(UnauthorizedError);
    // In jsdom, window.location.pathname is "/", so the redirect gets "/"
    expect(redirectSpy).toHaveBeenCalledWith("/");
  });

  it("throws ValidationError on 400 with field errors", async () => {
    mockFetch({ ok: false, status: 400, headers: { "content-type": "application/json" }, body: { errors: { email: ["Invalid email format"], name: ["Name is required"] } } });
    await expect(api.get("/auth/me")).rejects.toThrow(ValidationError);
    try {
      await api.get("/auth/me");
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationError);
      expect((err as ValidationError).fieldErrors).toEqual({ email: ["Invalid email format"], name: ["Name is required"] });
    }
  });

  it("throws NetworkError on fetch failure", async () => {
    mockFetchNetworkError();
    await expect(api.get("/auth/me")).rejects.toThrow(NetworkError);
  });
});

// ---------------------------------------------------------------------------
// POST
// ---------------------------------------------------------------------------

describe("api.post", () => {
  it("returns parsed JSON on 200/201", async () => {
    mockFetch({ ok: true, status: 201, headers: { "content-type": "application/json" }, body: { id: 1, name: "Test User", email: "test@example.com", role: "customer" } });
    const result = await api.post<{ id: number }>("/auth/register", { name: "Test", lastname: "User", email: "test@example.com", password: "password123!" });
    expect(result).toEqual({ id: 1, name: "Test User", email: "test@example.com", role: "customer" });
  });

  it("sends JSON body with credentials: same-origin", async () => {
    mockFetch({ ok: true, status: 200, headers: { "content-type": "application/json" }, body: { id: 1, name: "Test", email: "test@example.com", role: "customer" } });
    await api.post("/auth/login", { email: "test@example.com", password: "secret" });
    const fetchMock = getFetchMock();
    const callArgs = fetchMock.mock.calls[0]!;
    expect(callArgs[0]).toBe("/api/auth/login");
    expect(callArgs[1]?.credentials).toBe("same-origin");
    expect(callArgs[1]?.headers).toEqual({ "Content-Type": "application/json" });
    expect(JSON.parse(callArgs[1]?.body as string)).toEqual({ email: "test@example.com", password: "secret" });
  });

  it("throws UnauthorizedError on 401 and triggers redirect", async () => {
    mockFetch({ ok: false, status: 401, headers: { "content-type": "application/json" }, body: { error: "Invalid credentials" } });
    const redirectSpy = vi.fn();
    configureApiClient(redirectSpy);

    await expect(api.post("/auth/login", { email: "bad@example.com", password: "wrong" })).rejects.toThrow(UnauthorizedError);
    expect(redirectSpy).toHaveBeenCalled();
  });

  it("throws ValidationError on 400 with field errors", async () => {
    mockFetch({ ok: false, status: 400, headers: { "content-type": "application/json" }, body: { errors: { email: ["Email is required"], password: ["Password must be between 8 and 72 characters"] } } });
    await expect(api.post("/auth/register", { name: "", lastname: "", email: "", password: "short" })).rejects.toThrow(ValidationError);
    try {
      await api.post("/auth/register", { name: "", lastname: "", email: "", password: "short" });
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationError);
      expect((err as ValidationError).fieldErrors).toEqual({ email: ["Email is required"], password: ["Password must be between 8 and 72 characters"] });
    }
  });

  it("throws NetworkError on fetch failure", async () => {
    mockFetchNetworkError();
    await expect(api.post("/auth/login", { email: "a@b.com", password: "x" })).rejects.toThrow(NetworkError);
  });

  it("handles 400 with array errors (general)", async () => {
    mockFetch({ ok: false, status: 400, headers: { "content-type": "application/json" }, body: { errors: ["General error"] } });
    await expect(api.post("/auth/login", { email: "a@b.com", password: "x" })).rejects.toThrow(ValidationError);
    try {
      await api.post("/auth/login", { email: "a@b.com", password: "x" });
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationError);
      expect((err as ValidationError).fieldErrors).toEqual({ _general: ["General error"] });
    }
  });
});

// ---------------------------------------------------------------------------
// DELETE
// ---------------------------------------------------------------------------

describe("api.delete", () => {
  it("returns undefined on 204", async () => {
    mockFetch({ ok: true, status: 204, headers: {} });
    const result = await api.delete<void>("/auth/logout");
    expect(result).toBeUndefined();
  });

  it("throws UnauthorizedError on 401", async () => {
    mockFetch({ ok: false, status: 401, headers: { "content-type": "application/json" }, body: { error: "Unauthorized" } });
    await expect(api.delete("/auth/logout")).rejects.toThrow(UnauthorizedError);
  });
});

// ---------------------------------------------------------------------------
// 401 redirect — next param preservation
// ---------------------------------------------------------------------------

describe("401 redirect — next param", () => {
  it("passes the current path+query as `next` to the unauthorized handler", async () => {
    mockFetch({ ok: false, status: 401, headers: { "content-type": "application/json" }, body: { error: "Unauthorized" } });
    const redirectSpy = vi.fn();
    configureApiClient(redirectSpy);

    try {
      await api.get("/auth/me");
    } catch {
      // expected — the unauthorized handler is called
    }

    // The handler receives the current pathname+search as `next`
    expect(redirectSpy).toHaveBeenCalledWith("/");
  });
});
