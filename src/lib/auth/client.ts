import { createAuthClient } from "better-auth/react";

/**
 * Better Auth client for the browser. Talks to this app's own `/api/auth/*`
 * with the session cookie; there is no bearer-token or popup path.
 */
export const authClient = createAuthClient();

/**
 * Sign out of the local session, then navigate. Rejects when the server never
 * confirms: the session is an HttpOnly cookie only the server can clear, so a
 * redirect without confirmation would report a sign-out that did not happen.
 */
export async function signOut(redirectTo = "/"): Promise<void> {
  const { error } = await authClient.signOut();
  if (error) throw new Error(error.message ?? "Sign-out failed");
  window.location.href = redirectTo;
}
