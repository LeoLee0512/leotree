import { useState } from "react";
import { Modal } from "./modal";
import { TEMPLATES } from "@/lib/knowledge-tree/templates";
import { useI18n } from "@/lib/i18n";

export function NewTreeDialog({ templateId, onClose, onEnter }: { templateId?: string; onClose: () => void; onEnter: (title: string, description: string) => void }) {
  const { t } = useI18n();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const template = TEMPLATES.find((tpl) => tpl.id === templateId);
  return (
    <Modal title={t("newTreeTitle")} onClose={onClose}>
      <form className="form new-tree-form" onSubmit={(e) => { e.preventDefault(); onEnter(title, description); }}>
        <p className="brief">{template ? t("fromTemplateLead", { title: template.title }) : t("newTreeLead")}{t("editableLater")}</p>
        <label>{t("treeName")}<input autoFocus value={title} placeholder={t("untitled")} onChange={(e) => setTitle(e.target.value)} /></label>
        <label>{t("treeIntroOptional")}<textarea value={description} placeholder={t("treeIntroPlaceholder")} onChange={(e) => setDescription(e.target.value)} /></label>
        <div className="hero-actions">
          <button type="button" className="btn" onClick={onClose}>{t("exit")}</button>
          <button type="submit" className="btn primary">{t("enterTree")}</button>
        </div>
      </form>
    </Modal>
  );
}

export function TemplateDialog({ onClose, onPick }: { onClose: () => void; onPick: (id: string) => void }) {
  const { t } = useI18n();
  return (
    <Modal title={t("fromTemplateStart")} onClose={onClose}>
      <ul className="tpl-list">
        {TEMPLATES.filter((tpl) => tpl.id !== "blank").map((tpl) => (
          <li key={tpl.id}>
            <button type="button" className="tpl-pick" onClick={() => onPick(tpl.id)}><strong>{tpl.title}</strong><small>{tpl.description}</small></button>
          </li>
        ))}
      </ul>
      <button type="button" className="btn" onClick={onClose}>{t("cancel")}</button>
    </Modal>
  );
}
