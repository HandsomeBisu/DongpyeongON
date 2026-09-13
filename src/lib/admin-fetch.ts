export function adminFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  return fetch(input, {
    ...init,
    cache: "no-store",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...init.headers },
  });
}
