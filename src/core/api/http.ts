import { isJwtExpired } from "@/core/auth/jwt";
import { getStoredToken, invalidateAuthSession } from "@/core/auth/session";

const EXPIRED_SESSION_MESSAGE =
  "Sesiunea a expirat. Autentifică-te din nou pentru a continua.";

function createUnauthorizedResponse(message = EXPIRED_SESSION_MESSAGE): Response {
  return new Response(message, {
    status: 401,
    statusText: "Unauthorized",
  });
}

export async function apiFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  const token = getStoredToken();

  if (token && isJwtExpired(token)) {
    invalidateAuthSession();
    return createUnauthorizedResponse();
  }

  const headers = new Headers(init.headers);

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(input, {
    ...init,
    headers,
  });

  if (response.status === 401) {
    invalidateAuthSession();
  }

  return response;
}
