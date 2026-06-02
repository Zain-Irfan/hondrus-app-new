export const API_BASE = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`
  : "/api";

type GetToken = () => Promise<string | null>;

export async function apiFetch(
  path: string,
  init: RequestInit = {},
  getToken?: GetToken,
): Promise<Response> {
  const headers = new Headers(init.headers ?? {});
  if (getToken) {
    try {
      // Race against a 3-second timeout: Clerk's getToken() can hang forever
      // when the Clerk proxy is unreachable (e.g. in dev). Without this, every
      // API call blocks indefinitely waiting for a token that never arrives.
      const token = await Promise.race([
        getToken(),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000)),
      ]);
      if (token) headers.set("Authorization", `Bearer ${token}`);
    } catch {
      // Token unavailable — proceed unauthenticated; server will return 401 if required.
    }
  }
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(`${API_BASE}${path}`, { ...init, headers });
}
