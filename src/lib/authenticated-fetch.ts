import type { User } from "firebase/auth";

export async function authenticatedFetch(user: User, input: RequestInfo | URL, init: RequestInit = {}) {
  const token = await user.getIdToken();
  return fetch(input, { ...init, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...init.headers } });
}
