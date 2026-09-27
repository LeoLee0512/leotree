import { useState, type ReactNode } from "react";
import { signOut } from "./client";
import { useI18n } from "@/lib/i18n";
import { useCurrentUser, useCurrentUserState } from "./use-current-user";

/**
 * Render `children` for a signed-in visitor, `fallback` once we KNOW they are
 * signed out, and nothing while the session is still resolving (no signed-out
 * flash on hard reload).
 */
export function SignInGate({ children, fallback }: { children: ReactNode; fallback: ReactNode }) {
  const { user, isPending } = useCurrentUserState();
  if (isPending) return null;
  return <>{user ? children : fallback}</>;
}

/** Signed-in identity chip with a sign-out control. */
export function UserButton() {
  const { t } = useI18n();
  const user = useCurrentUser();
  // Sign-out can take a moment and can fail, so the control shows it is working
  // and cannot be fired twice.
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState("");
  if (!user) return null;
  const label = user.displayName ?? user.primaryEmail ?? t("account");
  return (
    <div className="user-chip">
      {user.profileImageUrl ? (
        <img src={user.profileImageUrl} alt="" className="user-avatar" />
      ) : (
        <span className="user-avatar user-initial" aria-hidden="true">{label.charAt(0).toUpperCase()}</span>
      )}
      <span className="user-label">{label}</span>
      {signOutError && <p role="alert" className="brief">{signOutError}</p>}
      <button
        type="button"
        className="btn ghost"
        disabled={signingOut}
        onClick={() => {
          setSigningOut(true);
          setSignOutError("");
          // Success navigates away; on failure re-enable so it can be retried.
          void signOut().catch(() => {
            setSigningOut(false);
            setSignOutError(t("signOutFailed"));
          });
        }}
      >
        {signingOut ? t("signingOut") : t("signOut")}
      </button>
    </div>
  );
}
