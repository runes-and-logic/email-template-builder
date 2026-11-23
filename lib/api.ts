export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { ...init, cache: "no-store", headers: { "Content-Type": "application/json", ...init?.headers } });
  const result = await response.json();
  if (!response.ok) throw new ApiError(response.status, result.error || "Request failed.");
  return result;
}
