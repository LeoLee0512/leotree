import { useState } from "react";
import { useI18n } from "@/lib/i18n";

export type StartChoice = "blank" | "template" | "import" | "web";

const PAGES = [
  ["welcome1Title", "welcome1Body", "welcome1Path"],
  ["welcome2Title", "welcome2Body", "welcome2Path"],
  ["welcome3Title", "welcome3Body", "welcome3Path"],
] as const;

export function Welcome({ onStart }: { onStart: (choice: StartChoice) => void }) {
  const { t } = useI18n();
  const [step, setStep] = useState(0);
  const [title, body, path] = PAGES[step];
  const last = step === PAGES.length - 1;
  return (
    <main className="wrap first-minute" data-onboarding="true">
      <header className="hero"><p className="brand-mark">{t("brandBeta")}</p><h1>{t("welcomeTitle")}</h1></header>
      <section className="welcome-card" aria-label={t("onboardingLabel")}>
        <p className="welcome-step">{t("stepOf", { step: step + 1, total: PAGES.length })}</p>
        <div aria-live="polite"><h2>{t(title)}</h2><p>{t(body)}</p><p className="welcome-path">{t(path)}</p></div>
        {!last ? (
          <div className="hero-actions">
            {step > 0 && <button className="btn" onClick={() => setStep(step - 1)}>{t("prevStep")}</button>}
            <button className="btn primary" onClick={() => setStep(step + 1)}>{t("nextStep")}</button>
            <button className="btn ghost" onClick={() => setStep(PAGES.length - 1)}>{t("skipIntro")}</button>
          </div>
        ) : (
          <div className="hero-actions">
            <button className="btn primary" onClick={() => onStart("blank")}>{t("newBlank")}</button>
            <button className="btn" onClick={() => onStart("template")}>{t("fromTemplateStart")}</button>
            <button className="btn" onClick={() => onStart("import")}>{t("import")}</button>
          </div>
        )}
      </section>
      <div className="product-entries">
        <button className="btn" onClick={() => onStart("web")}>{t("useWebNow")}</button>
        <a className="btn" href="/download">{t("downloadLocal")}</a>
      </div>
      <p className="brief">{t("windowsSoonWeb")}</p>
    </main>
  );
}
