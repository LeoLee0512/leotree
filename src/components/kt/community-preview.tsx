import { useI18n } from "@/lib/i18n";

export function CommunityPreview({ onReturn }: { onReturn: () => void }) {
  const { t } = useI18n();
  return (
    <section className="community-preview" data-community-state="preview">
      <header className="hero">
        <div>
          <p className="brand-mark">{t("brandPreview")}</p>
          <h1>{t("communityClosedTitle")}</h1>
          <p>{t("communityClosedBody")}</p>
        </div>
      </header>
      <p className="brief">{t("communityRetained")}</p>
      <button className="btn primary" onClick={onReturn}>{t("backGrove")}</button>
    </section>
  );
}
