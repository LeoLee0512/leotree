/**
 * Self-hosted Better Auth for this app (server-only).
 *
 * Only local email/password identities exist, and only after explicit durable
 * configuration (`npm run setup:account`, see `./config`). Knowledge stays in
 * the browser: it is never uploaded nor partitioned by account. There is no
 * OAuth, no bearer-token path and no platform identity gate.
 *
 * Clients import `./client` and `./use-current-user` instead of this module.
 */
import { betterAuth } from "better-auth";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { randomBytes } from "node:crypto";
import { Pool } from "pg";
import { ensureDbReady, getPglite } from "../db";
import { emailAndPasswordEnabled } from "./email-password";
import { pgliteDialect } from "./pglite-dialect";

// Kick (and share) PGLite bootstrap as soon as the auth server module loads.
void ensureDbReady();

/** Read an env var, treating empty/whitespace as unset. */
const env = (key: string): string | undefined => {
  const value = process.env[key]?.trim();
  return value ? value : undefined;
};

/**
 * A process-stable fallback secret for the unconfigured case (no accounts can be
 * created then, so nothing durable is ever signed with it). It lives on
 * `globalThis` so a dev HMR re-evaluation does not mint a new one. Enabled
 * email/password always requires an explicit `BETTER_AUTH_SECRET`.
 */
const globalAuthRef = globalThis as typeof globalThis & { __leoTreeAuthSecret__?: string };
function fallbackSecret(): string {
  globalAuthRef.__leoTreeAuthSecret__ ??= randomBytes(32).toString("hex");
  return globalAuthRef.__leoTreeAuthSecret__;
}

// Local `npm run dev` / `npm start` on the port-8080 contract. Browsers may send
// Origin as any of these for the same server.
const LOCAL_ORIGINS: string[] = [
  "http://localhost:8080",
  "http://127.0.0.1:8080",
  "http://[::1]:8080",
];

const explicitBaseURL = env("BETTER_AUTH_URL");
const databaseUrl = env("DATABASE_URL");

// Real Postgres when `DATABASE_URL` is set, else the embedded PGLite instance
// shared with `src/lib/db.ts`. Both apply `migrations/0001_auth.sql`.
const database = databaseUrl
  ? new Pool({ connectionString: databaseUrl })
  : { dialect: pgliteDialect(() => getPglite()), type: "postgres" as const };

export const auth = betterAuth({
  baseURL: explicitBaseURL ?? "http://localhost:8080",
  secret: env("BETTER_AUTH_SECRET") ?? fallbackSecret(),
  database,
  // Origins accepted on credentialed POSTs (sign-up / sign-in). Anything else is
  // rejected as "Invalid origin".
  trustedOrigins: explicitBaseURL ? [explicitBaseURL, ...LOCAL_ORIGINS] : LOCAL_ORIGINS,
  // Short signed cookie cache so session reads skip the database.
  session: { cookieCache: { enabled: true, maxAge: 300 } },
  ...(emailAndPasswordEnabled ? { emailAndPassword: { enabled: true } } : {}),
  // `__Host-` cookies: Secure, Path=/ and no Domain, so no other host can plant
  // a same-named cookie. Browsers accept Secure cookies on http://localhost.
  advanced: {
    useSecureCookies: false,
    defaultCookieAttributes: { secure: true, sameSite: "lax", path: "/" },
    cookies: {
      session_token: { name: "__Host-leo-tree.session_token" },
      session_data: { name: "__Host-leo-tree.session_data" },
      account_data: { name: "__Host-leo-tree.account_data" },
      dont_remember: { name: "__Host-leo-tree.dont_remember" },
    },
  },
  // Bridges Better Auth's Set-Cookie into TanStack Start responses; keep last.
  plugins: [tanstackStartCookies()],
});
