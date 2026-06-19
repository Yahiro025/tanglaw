const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

if (!backendUrl) {
  throw new Error("Missing NEXT_PUBLIC_BACKEND_URL in frontend environment");
}

const apiBase = `${backendUrl}/api`;

export async function fetchWithAuth(url: string, token: string | null | undefined, options: RequestInit = {}) {

  const headers = new Headers(options.headers ?? {});
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${apiBase}${url}`, { ...options, headers });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Request failed ${response.status}: ${response.statusText} ${errorText}`);
  }

  return response.json();
}
