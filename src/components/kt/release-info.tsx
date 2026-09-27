import { useState } from "react";
import { APP_VERSION } from "@/lib/product-contract";
import { BACKUP_TIME_KEY, backupAge, usePreference } from "@/lib/ui-preferences";
import { useI18n } from "@/lib/i18n";
import { Modal } from "./modal";

export function EssentialInfo() {
  const { t } = useI18n();
  return (
    <section className="settings-block essential-info">
      <h3>{t("essentialTitle")}</h3>
      <ul>
        <li><strong>{t("essential1Lead")}</strong>{t("essential1Body")}</li>
        <li><strong>{t("essential2Lead")}</strong>{t("essential2Body")}</li>
        <li><strong>{t("essential3Lead")}</strong>{t("essential3Body")}</li>
        <li><strong>{t("essential4Lead")}</strong>{t("essential4Body")}</li>
      </ul>
    </section>
  );
}

export function BackupRecency() {
  const { t } = useI18n();
  const at = usePreference(BACKUP_TIME_KEY);
  const age = backupAge(at);
  const label = age.kind === "never" ? t("never") : age.kind === "today" ? t("today") : t("daysAgo", { n: age.days });
  return (
    <section className="settings-block backup-recency">
      <h3>{t("backupReminder")}</h3>
      <p data-backup-recency="true">{t("lastFullBackup")}<strong>{label}</strong></p>
      <p className="brief">{t("backupRecencyHint")}</p>
    </section>
  );
}

export function FeedbackEntry() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState("");
  const configured = String(import.meta.env.VITE_FEEDBACK_URL ?? "");
  let url = "";
  try {
    const parsed = new URL(configured);
    if (parsed.protocol === "https:") url = parsed.href;
  } catch {
    /* Link is intentionally deferred until supplied. */
  }
  if (url) return <a className="btn" href={url} target="_blank" rel="noreferrer">{t("feedback")}</a>;
  return (
    <>
      <button className="btn" onClick={() => setOpen(true)}>{t("feedback")}</button>
      {open && (
        <Modal title={t("feedback")} onClose={() => setOpen(false)}>
          <p>{t("feedbackPreparing")}</p>
          <p className="brief">{t("feedbackNoSend")}</p>
          <button
            className="btn"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(`Leo Tree ${APP_VERSION}\n${t("feedbackOutline")}`);
                setCopied(t("copied"));
              } catch {
                setCopied(t("copyFailed"));
              }
            }}
          >
            {t("copyFeedbackOutline")}
          </button>
          <p role="status">{copied}</p>
        </Modal>
      )}
    </>
  );
}
