import { createFileRoute } from "@tanstack/react-router";
import { usePeachBoot } from "@/components/kt/peach-boot";
import { EssentialInfo, FeedbackEntry } from "@/components/kt/release-info";
import { I18nProvider, useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/download")({ component: DownloadRoute });

function DownloadRoute() {
  return (
    <I18nProvider>
      <DownloadPage />
    </I18nProvider>
  );
}

function DownloadPage() {
  const { t } = useI18n();
  usePeachBoot();
  return (
    <main className="wrap download-page">
      <header className="hero"><p className="brand-mark">LEO TREE</p><h1>{t("downloadTitle")}</h1><p>{t("downloadLead")}</p></header>
      <div className="edition-grid">
        <section className="welcome-card">
          <h2>{t("webEdition")}</h2>
          <p>{t("webEditionBody")}</p>
          <a className="btn primary" href="/?start=web">{t("useWebNow")}</a>
        </section>
        <section className="welcome-card">
          <h2>{t("windowsEdition")}</h2>
          <p>{t("comingSoon")}</p>
          <p className="brief">{t("windowsBody")}</p>
          <button className="btn" disabled>{t("windowsSoon")}</button>
        </section>
      </div>
      <EssentialInfo />
      <p className="brief">{t("progressNote")}</p>
      <FeedbackEntry />
      <a className="btn" href="/">{t("backHomeLong")}</a>
    </main>
  );
}
