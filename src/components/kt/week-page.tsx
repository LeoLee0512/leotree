import type { Commit } from "@/lib/knowledge-tree/operations";
import type { ReactNode } from "react";
import { CustomFields } from "./custom-fields";
import { useAsk } from "./confirm";
import { logStatusLabel } from "./log-page";
import { useI18n } from "@/lib/i18n";
import { emptyReview, NODE_STATUS_MARK } from "@/lib/knowledge-tree/factory";
import { buildWeekDraft, doneIncrement, yearWindow, weekSummary } from "@/lib/knowledge-tree/progress";
import { addDays, fmtDay, weekBounds } from "@/lib/knowledge-tree/dates";
import { getRuntime } from "@/lib/knowledge-tree/templates";
import { nodeLabel } from "@/lib/knowledge-tree/display";
import { treeReviewFields } from "@/lib/knowledge-tree/fields";
import type { KnowledgeTree, Workspace } from "@/lib/knowledge-tree/types";

export function WeekPage({
  ws,
  tree,
  weekId,
  commit,
  flash,
}: {
  ws: Workspace;
  tree: KnowledgeTree;
  weekId: string;
  commit: Commit;
  flash: (s: string) => void;
}) {
  const { start, isFuture, isCurrent } = weekBounds(weekId);
  const endShow = addDays(start, 6);
  const sum = weekSummary(tree, weekId);
  const r = tree.reviews[weekId] ?? emptyReview(weekId);
  const runtime = getRuntime(tree.templateId);
  const leakHint = runtime.reviewRiskHint?.(sum.weekLogs) ?? "";
  const reviewFields = treeReviewFields(tree);
  const months = yearWindow();
  const ask = useAsk();
  const { t } = useI18n();
  const list = (title: string, rows: ReactNode[], empty: string) => (
    <div className="list">
      <h2>{title}</h2>
      {rows.length ? rows : <p className="empty">{empty}</p>}
    </div>
  );
  return (
    <>
      <div className="week-nav">
        <button className="btn" onClick={() => commit("shiftWeek", -1)}>{t("prevWeek")}</button>
        <strong>{fmtDay(start)} ～ {fmtDay(endShow)}{isCurrent ? ` · ${t("thisWeek")}` : isFuture ? ` · ${t("future")}` : ""}</strong>
        <button className="btn" onClick={() => commit("shiftWeek", 1)}>{t("nextWeek")}</button>
      </div>
      <div className="summary">
        <div className="stat"><b>{sum.historyKnown ? sum.newlyDone.length : t("notEnoughRecords")}</b><span>{t("newlyDone")}</span></div>
        <div className="stat"><b>{sum.historyKnown ? sum.newlyDoing.length : t("notEnoughRecords")}</b><span>{t("newlyDoing")}</span></div>
        <div className="stat"><b>{sum.stalled.length}</b><span>{t("stalledNow")}</span></div>
        <div className="stat"><b>{sum.weekLogs.length}</b><span>{t("weekLogs")}</span></div>
      </div>
      <p className="brief">{t("weekBrief")}{!sum.historyKnown && t("weekHistoryPartial")} {t("weekBriefTail")}</p>
      {sum.unknownDoing ? <p className="empty">{t("unknownDoing", { n: sum.unknownDoing })}</p> : null}
      {isFuture ? <p className="empty">{t("futureEmpty")}</p> : null}
      {list(t("weekMastered"), sum.newlyDone.map((n) => <button className="row" key={n.id} disabled={!n.exists} onClick={() => commit("focusNode",n.id)}><span>{nodeLabel(n)}</span><small>{n.exists ? `P${n.priority} · ${t("backToNode")}` : t("nodeDeletedHistory")}</small></button>), t("weekMasteredEmpty"))}
      <h2 className="current-diagnostics">{t("diagnosticsToday")}</h2>
      <p className="brief">{t("diagnosticsBrief")}</p>
      {list(t("stalledOver14"), sum.stalled.map(({ node, days }) => <button className="row" key={node.id} onClick={() => commit("focusNode",node.id)}><span>{nodeLabel(node)}</span><small>{t("daysBackToNode", { n: Math.floor(days) })}</small></button>), t("stalledEmpty"))}
      {list(t("p0focus"), sum.p0focus.map((n) => <button className="row" key={n.id} onClick={() => commit("focusNode",n.id)}><span>{nodeLabel(n)}</span><small>{NODE_STATUS_MARK[n.status]} {t(n.status === "todo" ? "statusTodo" : n.status === "doing" ? "statusDoing" : "statusDone")}</small></button>), t("p0focusEmpty"))}
      {list(t("weekPractice"), sum.weekLogs.map((e) => (
        <button className="row" key={e.id} onClick={() => commit("patchUi", { tab: "log", logQuery: "", logStatus: "", expandedLogs: { ...ws.ui.expandedLogs, [e.id]: true }, scrollLogId: e.id })}>
          <span>{e.title || t("untitledLog")}</span><small>{e.date} · {logStatusLabel(t, e.status)}</small>
        </button>
      )), t("weekPracticeEmpty"))}
      {leakHint ? <div className="warn-banner">{leakHint}</div> : null}
      <section className="card" style={{ padding: 16, margin: "18px 0" }}>
        <div className="section-hd">
          <h2>{t("weekReview")}</h2>
          <button
            className="btn"
            onClick={() => {
              const has = [r.focus, r.stuck, r.nextMain, r.nextP2, r.risk, r.summary].some((x) => String(x || "").trim());
              const fill = () => {
                commit("patchReview", weekId, { summary: buildWeekDraft(tree, weekId, leakHint) });
                flash(t("draftFilled"));
              };
              if (!has) {
                fill();
                return;
              }
              ask({
                title: t("overwriteSummaryTitle"),
                body: t("overwriteSummaryBody"),
                confirmLabel: t("overwrite"),
                onConfirm: fill,
              });
            }}
          >
            {t("generateWeekDraft")}
          </button>
        </div>
        <div className="form">
          <label>{t("reviewFocus")} <input value={r.focus} onChange={(e) => commit("patchReview", weekId, { focus: e.target.value })} /></label>
          <label>{t("reviewStuck")} <textarea value={r.stuck} onChange={(e) => commit("patchReview", weekId, { stuck: e.target.value })} /></label>
          <div className="form-grid">
            <label>{t("reviewNextMain")} <input value={r.nextMain} onChange={(e) => commit("patchReview", weekId, { nextMain: e.target.value })} /></label>
            <label>{t("reviewNextP2")} <input value={r.nextP2} onChange={(e) => commit("patchReview", weekId, { nextP2: e.target.value })} /></label>
          </div>
          <label>{t("reviewRisk")} <textarea value={r.risk} onChange={(e) => commit("patchReview", weekId, { risk: e.target.value })} /></label>
          {reviewFields.length ? (
            <CustomFields
              defs={reviewFields}
              values={r.custom}
              onChange={(id, value) => commit("patchReview", weekId, { custom: { [id]: value } })}
            />
          ) : null}
          <label>{t("reviewSummary")} <textarea value={r.summary} onChange={(e) => commit("patchReview", weekId, { summary: e.target.value })} /></label>
        </div>
      </section>
      <section>
        <h2 className="serif" style={{ fontSize: "1.05rem", margin: "0 0 4px" }}>{t("yearProgress", { y: months[0].y })}</h2>
        <p className="brief">{t("yearProgressBrief")}</p>
        <div className="months">
          {months.map((m) => (
            <div className="month" key={m.key}><span>{m.label}</span><b>{doneIncrement(tree, m.y, m.m) ?? t("notEnoughRecords")}</b></div>
          ))}
        </div>
      </section>
    </>
  );
}
