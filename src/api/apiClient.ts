/**
 * Calls to the Cloud Functions API (functions/index.js — the `widgets`
 * function), signed in as the current client.
 *
 * Every request carries the Firebase ID token; the server takes the client's
 * identity from that alone. Failures become ApiError with the server's own
 * message, which is written to be shown on the page.
 */

const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/+$/, "");

export type TokenSource = () => Promise<string | null>;

export class ApiError extends Error {
  readonly status: number;
  /** Machine-readable reason from the server, e.g. "slot_unavailable". */
  readonly code: string | null;

  constructor(status: number, message: string, code: string | null = null) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export interface ApiResponse<T> {
  status: number;
  data: T;
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
}

export async function callApi<T>(
  getIdToken: TokenSource,
  path: string,
  { method = "GET", body }: RequestOptions = {},
): Promise<ApiResponse<T>> {
  if (!BASE_URL) throw new ApiError(0, "Online booking isn't set up yet. Please call the studio to book.");
  const token = await getIdToken();
  if (!token) throw new ApiError(401, "Sign in to continue.");

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    // Status 0: nothing came back. Callers treat that as "may or may not
    // have happened" — the checkout keeps its order id so a retry can't charge twice.
    throw new ApiError(0, "No connection. Check your internet and try again.");
  }

  const data = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    const message = typeof data?.error === "string" ? data.error : "Something went wrong. Please try again.";
    throw new ApiError(response.status, message, typeof data?.code === "string" ? data.code : null);
  }
  return { status: response.status, data: data as T };
}

/** A message fit for the page, from anything a call can throw. */
export function errorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : "Something went wrong. Please try again.";
}
