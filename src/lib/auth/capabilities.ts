import { useEffect, useState } from "react";

export type AuthCapabilities = {
  /** Email/password is configured on the server and its database answered a probe. */
  emailPassword: boolean;
  pending: boolean;
  /** The probe itself failed or timed out. */
  unavailable: boolean;
};

/** Runtime probe: sign-in UI appears only when the server confirms an account store. */
export function useAuthCapabilities(): AuthCapabilities {
  const [state, setState] = useState<AuthCapabilities>({ emailPassword: false, pending: true, unavailable: false });
  useEffect(() => {
    const abort = new AbortController();
    const timeout = setTimeout(() => abort.abort(), 5000);
    fetch("/api/auth/capabilities", { signal: abort.signal, cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error("Account service unavailable");
        return r.json() as Promise<{ emailPassword?: unknown }>;
      })
      .then((data) => setState({ emailPassword: data.emailPassword === true, pending: false, unavailable: false }))
      .catch(() => setState({ emailPassword: false, pending: false, unavailable: true }))
      .finally(() => clearTimeout(timeout));
    return () => { clearTimeout(timeout); abort.abort(); };
  }, []);
  return state;
}
