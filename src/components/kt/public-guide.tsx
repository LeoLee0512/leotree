import { progressContract, userGuide } from "@/lib/product-contract";
import { useI18n } from "@/lib/i18n";

export function PublicGuide() {
  const { t, locale } = useI18n();
  return (
    <section className="settings-block public-guide">
      <h3>{t("guideTitle")}</h3>
      {userGuide(locale).map(([question, answer]) => (
        <details key={question}><summary>{question}</summary><p>{answer}</p></details>
      ))}
    </section>
  );
}

export function ProgressDisclosure() {
  const { t, locale } = useI18n();
  return <details className="progress-disclosure"><summary>{t("progressHow")}</summary><p>{progressContract(locale)}</p></details>;
}
