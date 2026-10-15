export async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const response = await fetch(url, { ...init, headers });
  const body = await response.json().catch(() => ({}));
  if (response.status === 401 && typeof window !== "undefined") {
    window.location.assign("/login");
    throw new Error("Your session ended. Sign in again.");
  }
  if (!response.ok) throw new Error(body.error || "Something went wrong.");
  return body as T;
}
