/**
 * API client — thin wrapper over `fetch` with `credentials: "same-origin"`,
 * relative `/api/...` paths, JSON helpers, typed errors, and automatic
 * redirect-to-login on 401.
 *
 * All HTTP calls go through this module; no absolute backend URLs are used.
 *
 * @spec §23.2 (auth endpoints), §23.4 (frontend: credentials: "same-origin")
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Authenticated user shape returned by the backend (spec §23.2). */
export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

/** Field-level errors returned by the backend on 400 (spec §23.2). */
export interface FieldErrors {
  [field: string]: string[] | undefined;
}

// ---------------------------------------------------------------------------
// Typed errors
// ---------------------------------------------------------------------------

/** Base class for all API errors. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** Thrown when the server responds with 401 (unauthenticated). */
export class UnauthorizedError extends ApiError {
  constructor(message = "Authentication required") {
    super(401, message);
    this.name = "UnauthorizedError";
  }
}

/** Thrown when the server responds with 400 and field-level validation errors. */
export class ValidationError extends ApiError {
  constructor(
    message = "Validation failed",
    public readonly fieldErrors: FieldErrors,
  ) {
    super(400, message, fieldErrors);
    this.name = "ValidationError";
  }
}

/** Thrown when the request cannot reach the server (network failure). */
export class NetworkError extends ApiError {
  constructor(message = "Network error: unable to reach the server") {
    super(0, message);
    this.name = "NetworkError";
  }
}

// ---------------------------------------------------------------------------
// Unauthorized redirect handler
// ---------------------------------------------------------------------------

/**
 * Callback invoked when a 401 response is received.
 * The default implementation redirects to `/login?next=<current path>`
 * using `window.location` (full-page redirect, spec §23.4).
 * @param currentPath - The path+query that triggered the 401
 * @spec (spec §23.4)
 */
type UnauthorizedHandler = (currentPath: string) => void;

let _onUnauthorized: UnauthorizedHandler | null = null;

/**
 * Configure the API client's unauthorized handler.
 * Call this from the AuthProvider (or App root) after auth is resolved
 * so that 401s trigger a SPA navigation instead of a full-page reload.
 * @param handler - Function called on 401 with the current path
 * @spec (spec §23.4)
 */
export function configureApiClient(
  handler: UnauthorizedHandler,
): void {
  _onUnauthorized = handler;
}

// ---------------------------------------------------------------------------
// Core request
// ---------------------------------------------------------------------------

const API_PREFIX = "/api";

function buildUrl(path: string): string {
  return `${API_PREFIX}${path}`;
}

/**
 * Core request helper. Handles credentials, JSON parsing, and error
 * classification (401 → UnauthorizedError, 400 with field errors →
 * ValidationError, network failures → NetworkError).
 * @param method - HTTP method
 * @param path - Relative path under `/api` (e.g. `/auth/me`)
 * @param body - Optional request body (will be JSON-serialized)
 * @returns Parsed JSON response body
 * @spec (spec §23.2)
 */
async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const url = buildUrl(path);
  // eslint-disable-next-line no-undef
  const options: RequestInit = {
    method,
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  };

  let response: Response;
  try {
    response = await fetch(url, options);
  } catch {
    throw new NetworkError();
  }

  // --- 401: trigger redirect and throw ---
  if (response.status === 401) {
    const currentPath =
      window.location.pathname + window.location.search;
    if (_onUnauthorized) {
      _onUnauthorized(currentPath);
    } else {
      window.location.href = `/login?next=${encodeURIComponent(currentPath)}`;
    }
    throw new UnauthorizedError("Authentication required");
  }

  // --- Parse body ---
  const contentType = response.headers.get("content-type");
  let data: unknown;
  if (contentType?.includes("application/json")) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  // --- Non-ok status ---
  if (!response.ok) {
    if (
      response.status === 400 &&
      typeof data === "object" &&
      data !== null &&
      "errors" in data
    ) {
      const errors = data as { errors: FieldErrors | string[] };
      if (
        typeof errors.errors === "object" &&
        !Array.isArray(errors.errors)
      ) {
        throw new ValidationError("Validation failed", errors.errors);
      }
      throw new ValidationError("Validation failed", {
        _general: errors.errors as string[],
      });
    }
    const message =
      typeof data === "object" &&
      data !== null &&
      "message" in data
        ? String((data as { message: unknown }).message)
        : `Request failed with status ${response.status}`;
    throw new ApiError(response.status, message, data);
  }

  // --- 204 No Content ---
  if (response.status === 204) {
    return undefined as T;
  }

  return data as T;
}

// ---------------------------------------------------------------------------
// Public client
// ---------------------------------------------------------------------------

/**
 * Typed API client with methods for each HTTP verb.
 * All paths are relative to `/api`; the Vite dev proxy forwards them
 * to the backend (spec §23.2, §23.4).
 * @spec (spec §23.2)
 */
export const api = {
  /**
   * Perform a GET request.
   * @param path - Relative path under `/api` (e.g. `/auth/me`)
   * @returns Parsed JSON response body
   * @spec (spec §23.2)
   */
  get<T>(path: string): Promise<T> {
    return request<T>("GET", path);
  },

  /**
   * Perform a POST request with an optional JSON body.
   * @param path - Relative path under `/api` (e.g. `/auth/login`)
   * @param body - Optional request payload
   * @returns Parsed JSON response body
   * @spec (spec §23.2)
   */
  post<T>(path: string, body?: unknown): Promise<T> {
    return request<T>("POST", path, body);
  },

  /**
   * Perform a DELETE request.
   * @param path - Relative path under `/api` (e.g. `/auth/logout`)
   * @returns Parsed JSON response body (or undefined for 204)
   * @spec (spec §23.2)
   */
  delete<T>(path: string): Promise<T> {
    return request<T>("DELETE", path);
  },
};
