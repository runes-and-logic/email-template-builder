export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

const RETRY_DELAY_MS = 600;
const UNAVAILABLE = "The service is unavailable. Please try again.";
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { ...init, cache: "no-store", headers: { "Content-Type": "application/json", ...init?.headers } });
  // A proxy failure (e.g. the backend restarting) returns an HTML error page rather than JSON.
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new ApiError(response.status, result?.error || (response.status >= 500 ? UNAVAILABLE : "Request failed."));
  if (result === null) throw new ApiError(502, UNAVAILABLE);
  return result;
}

/**
 * JSON API call. Read-only (GET) requests retry once after a dropped connection or 5xx response,
 * so a momentary blip such as a backend restart doesn't surface as an error. Writes never retry.
 */
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const method = (init?.method || "GET").toUpperCase();
  try {
    return await request<T>(path, init);
  } catch (error) {
    const transient = error instanceof TypeError || (error instanceof ApiError && error.status >= 500);
    if (method !== "GET" || !transient || init?.signal?.aborted) throw error;
    await sleep(RETRY_DELAY_MS);
    return request<T>(path, init);
  }
}
