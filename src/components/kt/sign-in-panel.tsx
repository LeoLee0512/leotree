import { useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth/client";
import { useAuthCapabilities } from "@/lib/auth/capabilities";
import { useI18n } from "@/lib/i18n";

export function SignInPanel({ showGuest, onGuest }: { showGuest?: boolean; onGuest?: () => void }) {
  const { t } = useI18n();
  const capability = useAuthCapabilities();
  const [signup, setSignup] = useState(false);
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!capability.emailPassword) return;
    setError("");
    const email = account.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError(t("authInvalidEmail")); return; }
    if (password.length < 8) { setError(t("authWeakPassword")); return; }
    setBusy(true);
    try {
      const result = signup
        ? await authClient.signUp.email({ email, password, name: email.split("@")[0] })
        : await authClient.signIn.email({ email, password });
      if (result.error) throw new Error(result.error.message || t("authFailed"));
      window.location.assign("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("authFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="settings-auth">
      <p className="brief">{t("localSpaceNote")}</p>
      {showGuest && onGuest && <button type="button" className="btn primary guest-btn" onClick={onGuest}>{t("openLocalSpace")}</button>}
      {capability.pending ? (
        <p className="brief">{t("checkingAccount")}</p>
      ) : !capability.emailPassword ? (
        <p className="brief" data-auth-availability="unavailable">{capability.unavailable ? t("accountUnavailable") : t("accountNotOffered")}</p>
      ) : (
        <form className="auth-form" onSubmit={submit} data-auth-availability="email">
          <p className="brief">{t("emailPasswordNote")}</p>
          <label>{t("email")}<input type="email" autoComplete="email" required value={account} onChange={(e) => setAccount(e.target.value)} /></label>
          <label>{t("password")}<input type="password" autoComplete={signup ? "new-password" : "current-password"} required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} /></label>
          {error && <p role="alert">{error}</p>}
          <button className="btn primary" type="submit" disabled={busy}>{busy ? "…" : signup ? t("signUpSubmit") : t("signInSubmit")}</button>
          <button className="btn ghost" type="button" onClick={() => { setSignup(!signup); setError(""); }}>{signup ? t("toggleSignIn") : t("toggleSignUp")}</button>
        </form>
      )}
    </div>
  );
}
