import type { Commit } from "@/lib/knowledge-tree/operations";
import { useEffect, useMemo, useState } from "react";
import { CustomFields } from "./custom-fields";
import { MathEditor } from "./math";
import { useAsk } from "./confirm";
import { useI18n } from "@/lib/i18n";
import { emptyReview } from "@/lib/knowledge-tree/factory";
import { weekIdFromDate } from "@/lib/knowledge-tree/dates";
import { getRuntime } from "@/lib/knowledge-tree/templates";
import { nodeLabel } from "@/lib/knowledge-tree/display";
import { treeLogFields } from "@/lib/knowledge-tree/fields";
import type { KnowledgeTree, LogStatus, PracticeLog, Workspace } from "@/lib/knowledge-tree/types";

type T = ReturnType<typeof useI18n>["t"];

export const LOG_STATUSES: readonly LogStatus[] = ["idea", "running", "done", "dropped"] as const;

/** Locale-aware label for a practice-log status (the domain constant LOG_STATUS_LABEL is Chinese-only). */
export function logStatusLabel(t: T, status: LogStatus): string {
  switch (status) {
    case "idea": return t("logIdea");
    case "running": return t("logRunning");
    case "done": return t("logDone");
    case "dropped": return t("logDropped");
  }
}

function snippet(s: string, n: number) {
  const t = String(s || "").replace(/\s+/g, " ").trim();
  return t.length <= n ? t : `${t.slice(0, n)}…`;
}

export function LogPage({
  ws,
  tree,
  commit,
  flash,
}: {
  ws: Workspace;
  tree: KnowledgeTree;
  commit: Commit;
  flash: (s: string) => void;
}) {
  const { t } = useI18n();
  const runtime = getRuntime(tree.templateId);
  const list = tree.logs.slice().sort((a, b) => String(b.date).localeCompare(String(a.date)) || String(b.createdAt).localeCompare(String(a.createdAt)));
  const vis = list.filter((exp) => {
    if (ws.ui.logStatus && exp.status !== ws.ui.logStatus) return false;
    const q = ws.ui.logQuery.trim().toLowerCase();
    if (!q) return true;
    return [exp.title, exp.hypothesis, exp.question, exp.conclusion, (exp.tags || []).join(" ")].join(" ").toLowerCase().includes(q);
  });
  const weekId = ws.ui.weekId || weekIdFromDate();
  const review = tree.reviews[weekId] ?? emptyReview(weekId);

  useEffect(() => {
    if (!ws.ui.scrollLogId) return;
    document.getElementById(`log-${ws.ui.scrollLogId}`)?.scrollIntoView({ block: "start" });
    commit("patchUi", { scrollLogId: "" });
  }, [ws.ui.scrollLogId, commit, ws]);

  const statusChips: ReadonlyArray<["" | LogStatus, string]> = [
    ["", t("allStatus")],
    ...LOG_STATUSES.map((s) => [s, logStatusLabel(t, s)] as ["" | LogStatus, string]),
  ];

  return (
    <>
      <div className="hero-actions" style={{ marginBottom: 12, justifyContent: "flex-start" }}>
        <button className="btn primary" onClick={() => commit("addLog")}>{t("newLog")}</button>
        <button
          className="btn"
          onClick={() => {
            const q = (review.nextMain || review.focus || "").trim();
            if (!q) { flash(t("weekMainMissing")); return; }
            commit("addLog", { title: q.slice(0, 80), hypothesis: q, question: q });
            flash(t("draftCreated"));
          }}
        >
          {t("draftFromWeekMain")}
        </button>
      </div>
      <div className="filters">
        <input className="search" placeholder={t("searchLogs")} value={ws.ui.logQuery} onChange={(e) => commit("patchUi", { logQuery: e.target.value })} />
        {statusChips.map(([v, l]) => (
          <button key={v} className={`chip ${ws.ui.logStatus === v ? "on" : ""}`} onClick={() => commit("patchUi", { logStatus: v })}>{l}</button>
        ))}
      </div>
      {vis.length ? vis.map((exp) => (
        <LogCard key={exp.id} exp={exp} tree={tree} ws={ws} commit={commit} hasRisk={runtime.logHasRisk?.(exp) ?? false} />
      )) : <p className="empty">{t("noLogs")}</p>}
    </>
  );
}

function LogCard({
  exp,
  tree,
  ws,
  commit,
  hasRisk,
}: {
  exp: PracticeLog;
  tree: KnowledgeTree;
  ws: Workspace;
  commit: Commit;
  hasRisk: boolean;
}) {
  const { t } = useI18n();
  const open = !!ws.ui.expandedLogs[exp.id];
  const logFields = treeLogFields(tree);
  const [linkQ, setLinkQ] = useState("");
  const ask = useAsk();
  // The SNN template names its metrics group "指标" (template data is Chinese-only).
  const metricDefs = logFields.filter((f) => f.group === "指标" && f.type === "text");
  const metrics = metricDefs
    .map((f) => [f.label, exp.custom[f.id]] as const)
    .filter(([, v]) => v !== "" && v != null);
  const linkItems = useMemo(
    () => tree.nodes.filter((n) => !linkQ.trim() || `${n.id} ${n.title}`.toLowerCase().includes(linkQ.trim().toLowerCase())),
    [tree.nodes, linkQ],
  );
  return (
    <article className={`exp ${hasRisk ? "warn" : ""}`} id={`log-${exp.id}`}>
      <button type="button" className="exp-hd" aria-expanded={open} onClick={() => commit("patchUi", { expandedLogs: { ...ws.ui.expandedLogs, [exp.id]: !open } })}>
        <div>
          <h3>{exp.title || t("untitledLog")}</h3>
          <div className="meta">{exp.date} · {logStatusLabel(t, exp.status)}{hasRisk ? ` · ${t("riskUnconfirmed")}` : ""}</div>
          <div className="hint">{snippet(exp.hypothesis || exp.question, 40) || t("noHypothesis")}</div>
          {metricDefs.length ? (
            <div className="metrics">{metrics.length ? metrics.map(([k, v]) => `${k} ${v}`).join(" · ") : t("metricsMissing")}</div>
          ) : null}
        </div>
        <span className="prio">{open ? t("collapse") : t("expand")}</span>
      </button>
      {open && (
        <div className="form" style={{ marginTop: 12 }}>
          <div className="form-grid">
            <label>{t("logTitle")} <input value={exp.title} onChange={(e) => commit("patchLog", exp.id, { title: e.target.value })} /></label>
            <label>{t("logDate")} <input type="date" value={exp.date} onChange={(e) => commit("patchLog", exp.id, { date: e.target.value })} /></label>
          </div>
          <label>{t("logStatus")}
            <select value={exp.status} onChange={(e) => commit("patchLog", exp.id, { status: e.target.value as LogStatus })}>
              {LOG_STATUSES.map((k) => <option key={k} value={k}>{logStatusLabel(t, k)}</option>)}
            </select>
          </label>
          <MathEditor variant="compact" label={t("logQuestion")} value={exp.question} onChange={(question) => commit("patchLog", exp.id, { question })} />
          <MathEditor variant="compact" label={t("logHypothesis")} value={exp.hypothesis} onChange={(hypothesis) => commit("patchLog", exp.id, { hypothesis })} />
          <MathEditor variant="compact" label={t("logProcess")} value={exp.process} onChange={(process) => commit("patchLog", exp.id, { process })} />
          <MathEditor variant="compact" label={t("logConclusion")} value={exp.conclusion} onChange={(conclusion) => commit("patchLog", exp.id, { conclusion })} />
          {logFields.length ? (
            <CustomFields
              defs={logFields}
              values={exp.custom}
              onChange={(id, value) => commit("patchLog", exp.id, { custom: { [id]: value } })}
            />
          ) : null}
          <div className="links practice-return">{exp.linkedNodeIds.map(id => { const n = tree.nodes.find(x => x.id === id); return n ? <button className="btn" key={id} onClick={() => commit("focusNode",id)}>{t("backToNodeNamed", { title: nodeLabel(n) })}</button> : null; })}</div>
          <div className="field">
            {t("linkedNodes")}
            <input type="text" placeholder={t("searchIdOrName")} value={linkQ} onChange={(e) => setLinkQ(e.target.value)} />
            <div className="link-list">
              {linkItems.map((n) => (
                <label key={n.id}>
                  <input
                    type="checkbox"
                    checked={exp.linkedNodeIds.includes(n.id)}
                    onChange={(e) => {
                      const set = new Set(exp.linkedNodeIds);
                      if (e.target.checked) set.add(n.id);
                      else set.delete(n.id);
                      commit("patchLog", exp.id, { linkedNodeIds: Array.from(set) });
                    }}
                  />
                  <span>{nodeLabel(n)}</span>
                </label>
              ))}
            </div>
          </div>
          <label>{t("tagsComma")} <input value={(exp.tags || []).join(", ")} onChange={(e) => commit("patchLog", exp.id, { tags: e.target.value.split(/[,，]/).map((s) => s.trim()).filter(Boolean) })} /></label>
          <label>{t("attachmentNote")} <input value={exp.attachmentNote} onChange={(e) => commit("patchLog", exp.id, { attachmentNote: e.target.value })} /></label>
          <div>
            <button className="btn danger" onClick={() => {
              ask({
                title: t("deleteLogTitle", { title: exp.title || t("untitledLog") }),
                body: t("cannotUndo"),
                onConfirm: () => commit("deleteLog", exp.id),
              });
            }}>{t("delete")}</button>
          </div>
        </div>
      )}
    </article>
  );
}
