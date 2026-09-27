import type { Commit } from "@/lib/knowledge-tree/operations";
import { useAsk } from "./confirm";
import { Modal } from "./modal";
import { useI18n } from "@/lib/i18n";
import { TEMPLATES } from "@/lib/knowledge-tree/templates";
import type { Workspace } from "@/lib/knowledge-tree/types";

export function TreeSwitcher({
  ws,
  commit,
  onImport,
  onCreate,
  onClose,
  onRename,
}: {
  ws: Workspace;
  commit: Commit;
  onImport: () => void;
  onCreate: (templateId?: string) => void;
  onClose: () => void;
  onRename: (id: string) => void;
}) {
  const ask = useAsk();
  const { t } = useI18n();
  return (
    <Modal title={t("myTreesTitle")} onClose={onClose}>
        {Object.values(ws.trees).map((tr) => (
          <div key={tr.id} className="tree-row">
            <button
              className={`tree-pick ${ws.currentTreeId === tr.id ? "current" : ""}`}
              onClick={() => commit("setCurrentTree", tr.id)}
            >
              {tr.title}
              <small>{tr.description || t("noIntro")} · {t("nodesCount", { n: tr.nodes.length })}</small>
            </button>
            <div className="hero-actions">
              <button className="btn ghost" onClick={() => onRename(tr.id)}>{t("rename")}</button>
              <button className="btn ghost" onClick={() => commit("duplicateTree", tr.id)}>{t("duplicate")}</button>
              <button
                className="btn danger"
                onClick={() => {
                  ask({
                    title: t("deleteTreeTitle", { title: tr.title }),
                    body: t("deleteTreeBody"),
                    onConfirm: () => commit("deleteTree", tr.id),
                  });
                }}
              >
                {t("delete")}
              </button>
            </div>
          </div>
        ))}
        <div className="hero-actions" style={{ marginTop: 14, justifyContent: "flex-start" }}>
          <button className="btn primary" onClick={() => onCreate()}>{t("newBlankShort")}</button>
          {TEMPLATES.filter((tpl) => tpl.id !== "blank").map((tpl) => (
            <button key={tpl.id} className="btn" onClick={() => onCreate(tpl.id)}>
              {t("fromTemplate", { title: tpl.title })}
            </button>
          ))}
          <button className="btn" onClick={onImport}>{t("importJson")}</button>
        </div>

    </Modal>
  );
}
