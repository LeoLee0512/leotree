import { createContext, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { WorkspaceService } from "@/lib/knowledge-tree/service";
import { exportWorkspace, recoveryCandidates } from "@/lib/knowledge-tree/storage";
import { emptyWorkspace } from "@/lib/knowledge-tree/factory";
import { previewImport, type ImportMode, type ImportPreview } from "@/lib/knowledge-tree/import";
import { createBackup, previewBackupRestore, type BackupPreview } from "@/lib/knowledge-tree/backup";
import type { Workspace } from "@/lib/knowledge-tree/types";
import { Modal } from "./modal";
import { ConfirmModal, type ConfirmRequest } from "./confirm";
import { BACKUP_TIME_KEY, writePreference } from "@/lib/ui-preferences";
import { userMessage, errorMessage, conflictLabel } from "@/lib/user-messages";
import { useI18n } from "@/lib/i18n";
import { dismissPeachBoot } from "./peach-boot";

export function downloadData(name: string, data: string | Uint8Array, type = "application/json") {
  const blob = new Blob([typeof data === "string" ? data : new Uint8Array(data)], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

type Context = { service: WorkspaceService; openImport: (raw: unknown) => void; pickImport: () => void; backup: () => void };
const DataContext = createContext<Context | null>(null);
export function useDataActions() {
  const value = useContext(DataContext);
  if (!value) throw new Error("Missing data boundary");
  return value;
}
export function useWorkspaceService() { return useDataActions().service; }

export function DataBoundary({ children }: { children: ReactNode }) {
  const { t, locale } = useI18n();
  const [service] = useState(() => new WorkspaceService());
  const state = useSyncExternalStore(service.subscribe, service.getSnapshot, service.getSnapshot);
  const [raw, setRaw] = useState<unknown>(null);
  const [zip, setZip] = useState<Uint8Array | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => service.start(), [service]);
  useEffect(() => { if (state.recovery) dismissPeachBoot(); }, [state.recovery]);

  async function backup(rescue = false) {
    setBusy(true); setError("");
    try {
      downloadData(rescue ? "LeoTree-rescue.zip" : "LeoTree-backup.zip", await createBackup(service, rescue), "application/zip");
      if (!rescue && !writePreference(BACKUP_TIME_KEY, new Date().toISOString())) setError(t("backupTimeNotSaved"));
    } catch (e) {
      setError(errorMessage(e, locale));
    } finally {
      setBusy(false);
    }
  }
  const value = useMemo<Context>(
    () => ({ service, openImport: setRaw, pickImport: () => fileRef.current?.click(), backup: () => { void backup(); } }),
    // backup only closes over stable state setters and the service
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [service],
  );
  const attention = !["SAVED", "SAVING"].includes(state.status);
  const stateText =
    state.status === "SAVED" ? t("stateSaved")
    : state.status === "SAVING" ? t("stateSaving")
    : state.status === "RECOVERY_REQUIRED" ? t("stateRecovery")
    : t("stateAttention");
  return (
    <DataContext.Provider value={value}>
      <div className={`save-notice state-${state.status.toLowerCase()}`} role="status" aria-live="polite" data-save-state={state.status}>
        <span>{stateText}</span>
        {attention && (
          <>
            <span>{userMessage(state.errorCode, locale)}</span>
            <details className="error-details"><summary>{t("troubleshoot")}</summary><pre>{state.errorCode} · {state.message}</pre></details>
            <button className="btn" onClick={() => void service.retry()}>{t("retrySave")}</button>
            <button className="btn" onClick={() => downloadData("LeoTree-rescue.json", exportWorkspace(state.workspace))}>{t("exportDraftJson")}</button>
            <button className="btn" disabled={busy} onClick={() => void backup(true)}>{t("rescueZip")}</button>
            {!state.recovery && (
              <button
                className="btn danger"
                onClick={() => setConfirm({ title: t("discardDraftTitle"), body: t("discardDraftBody"), confirmLabel: t("discardDraftOk"), onConfirm: () => { void service.discardDraft(true); } })}
              >
                {t("discardDraft")}
              </button>
            )}
          </>
        )}
        {busy && <span>{t("preparingFile")}</span>}
        {error && <span role="alert">{error}</span>}
      </div>
      {state.recovery ? <RecoveryPanel service={service} /> : children}
      <input
        ref={fileRef}
        hidden
        type="file"
        accept=".json,.zip,application/json,application/zip"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file) return;
          setError("");
          try {
            if (file.name.toLowerCase().endsWith(".zip")) setZip(new Uint8Array(await file.arrayBuffer()));
            else setRaw(JSON.parse(await file.text()));
          } catch (e) {
            setError(t("importNothingWritten", { err: errorMessage(e, locale) }));
          }
        }}
      />
      {raw !== null && <ImportDialog raw={raw} onClose={() => setRaw(null)} />}
      {zip && <RestoreDialog zip={zip} onClose={() => setZip(null)} />}
      <ConfirmModal req={confirm} onClose={() => setConfirm(null)} />
    </DataContext.Provider>
  );
}

export function DataTools() {
  const { t } = useI18n();
  const actions = useDataActions();
  return (
    <div className="data-tools">
      <button className="btn" onClick={actions.backup}>{t("fullBackupZip")}</button>
      <button className="btn" onClick={actions.pickImport}>{t("importOrRestore")}</button>
      <small>{t("jsonNoBytes")}</small>
    </div>
  );
}

function RecoveryPanel({ service }: { service: WorkspaceService }) {
  const { t, locale } = useI18n();
  const state = useSyncExternalStore(service.subscribe, service.getSnapshot, service.getSnapshot);
  const source = state.recovery!;
  const [candidate, setCandidate] = useState<Workspace | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  // Candidates only change with the recovery source; do not re-read storage on every keystroke.
  const [candidates, setCandidates] = useState(() => recoveryCandidates(service.adapter));
  useEffect(() => { setCandidates(recoveryCandidates(service.adapter)); }, [service, source]);
  const candidateLabel = (key: string, n: number) =>
    key.includes("last-good") ? t("previewLastGood", { n }) : key.includes("v3") ? t("previewV3", { n }) : t("previewLegacy", { n });
  return (
    <main className="wrap recovery-panel">
      <h1>{t("recoveryTitle")}</h1>
      <p data-error-code={source.code}>{userMessage(source.code, locale)}</p>
      <details className="error-details"><summary>{t("troubleshoot")}</summary><pre>{source.code} · {source.message}</pre></details>
      <button className="btn" disabled={source.raw === null} onClick={() => downloadData("LeoTree-original-source.txt", source.raw!, "text/plain")}>{t("downloadOriginal")}</button>
      <h2>{t("makeRecoveryCopy")}</h2>
      <p>{t("recoveryHint")}</p>
      {candidates.map((c) => (
        <button className="btn" key={c.key} data-recovery-source={c.key} onClick={() => { setCandidate(c.workspace!); setConfirmed(false); }}>
          {candidateLabel(c.key, Object.keys(c.workspace!.trees).length)}
        </button>
      ))}
      <button className="btn" disabled={source.code === "STORAGE_ERROR"} onClick={() => { setCandidate(emptyWorkspace()); setConfirmed(false); }}>{t("createBlankSafe")}</button>
      {candidate && (
        <section>
          <h2>{t("validatedCandidate")}</h2>
          <WorkspaceSummary workspace={candidate} />
          <label className="check-line"><input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />{t("confirmRecoveryCheck")}</label>
          <button className="btn primary" disabled={!confirmed} onClick={() => void service.recover(candidate, true)}>{t("activateRecovery")}</button>
        </section>
      )}
    </main>
  );
}

function WorkspaceSummary({ workspace }: { workspace: Workspace }) {
  const { t } = useI18n();
  return (
    <ul>
      {Object.values(workspace.trees).map((tree) => (
        <li key={tree.id}>{t("treeSummary", { title: tree.title, sections: tree.sections.length, nodes: tree.nodes.length, logs: tree.logs.length, reviews: Object.keys(tree.reviews).length })}</li>
      ))}
    </ul>
  );
}

/** Runs the confirmed import; `saving` is always released, even when the service throws. */
function useAccept(onClose: () => void, setError: (message: string) => void) {
  const { locale } = useI18n();
  const service = useWorkspaceService();
  const [saving, setSaving] = useState(false);
  const accept = async (preview: ImportPreview | BackupPreview) => {
    setSaving(true);
    try {
      if (await service.acceptPreview(preview, true)) onClose();
      else setError(userMessage(service.getSnapshot().errorCode, locale));
    } catch (e) {
      setError(errorMessage(e, locale));
    } finally {
      setSaving(false);
    }
  };
  return { saving, accept };
}

function ImportDialog({ raw, onClose }: { raw: unknown; onClose: () => void }) {
  const { t, locale } = useI18n();
  const service = useWorkspaceService();
  const [mode, setMode] = useState<ImportMode>("new");
  const [preferIncoming, setPreferIncoming] = useState(false);
  const [omitAttachments, setOmitAttachments] = useState(false);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [error, setError] = useState("");
  const { saving, accept } = useAccept(onClose, setError);
  useEffect(() => {
    let gone = false;
    setPreview(null); setError("");
    void previewImport(service, raw, mode, { preferIncoming, omitAttachments })
      .then((p) => { if (!gone) setPreview(p); })
      .catch((e) => { if (!gone) setError(errorMessage(e, locale)); });
    return () => { gone = true; };
  }, [service, raw, mode, preferIncoming, omitAttachments, locale]);
  return (
    <Modal title={t("importPreview")} onClose={onClose}>
      <div className="form">
        <label>{t("importMode")}
          <select value={mode} onChange={(e) => { setMode(e.target.value as ImportMode); setPreferIncoming(false); }}>
            <option value="new">{t("importModeNew")}</option>
            <option value="restore">{t("importModeRestore")}</option>
            <option value="merge">{t("importModeMerge")}</option>
          </select>
        </label>
        {mode !== "new" && (
          <label className="check-line">
            <input type="checkbox" checked={preferIncoming} onChange={(e) => setPreferIncoming(e.target.checked)} />
            {t("preferIncoming")}{mode === "merge" ? t("preferIncomingMerge") : t("preferIncomingRestore")}
          </label>
        )}
        <label className="check-line"><input type="checkbox" checked={omitAttachments} onChange={(e) => setOmitAttachments(e.target.checked)} />{t("omitAttachments")}</label>
        {error && <p role="alert">{t("nothingWritten", { err: error })}</p>}
        {preview && (
          <>
            <WorkspaceSummary workspace={preview.workspace} />
            <p>{t("importCounts", { omitted: preview.omittedAttachments, files: preview.files.length })}</p>
            <details open={mode !== "new"}>
              <summary>{t("conflictsSummary", { n: preview.conflicts.length })}</summary>
              <ul>{preview.conflicts.map((c, i) => <li key={i}><strong>{conflictLabel(c.kind, locale)}</strong> {c.nodeId} — {c.detail}</li>)}</ul>
            </details>
            <details><summary>{t("viewFullImport")}</summary><pre className="data-preview">{exportWorkspace(preview.workspace)}</pre></details>
            <button className="btn primary" disabled={saving} onClick={() => void accept(preview)}>{t("confirmImport")}</button>
          </>
        )}
      </div>
    </Modal>
  );
}

function RestoreDialog({ zip, onClose }: { zip: Uint8Array; onClose: () => void }) {
  const { t, locale } = useI18n();
  const service = useWorkspaceService();
  const [preview, setPreview] = useState<BackupPreview | null>(null);
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const { saving, accept } = useAccept(onClose, setError);
  useEffect(() => {
    let gone = false;
    void previewBackupRestore(service, zip)
      .then((p) => { if (!gone) setPreview(p); })
      .catch((e) => { if (!gone) setError(errorMessage(e, locale)); });
    return () => { gone = true; };
  }, [service, zip, locale]);
  return (
    <Modal title={t("restorePreview")} onClose={onClose}>
      {error && <p role="alert">{t("nothingWritten", { err: error })}</p>}
      {preview && (
        <>
          <p>{t("backupMeta", { version: preview.manifest.backupVersion, createdAt: preview.manifest.createdAt, n: preview.files.length })}</p>
          <WorkspaceSummary workspace={preview.workspace} />
          <p>{t("restoreReplaces")}</p>
          <label className="check-line"><input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />{t("confirmRestoreCheck")}</label>
          <button className="btn primary" disabled={!confirmed || saving} onClick={() => void accept(preview)}>{t("confirmRestore")}</button>
        </>
      )}
    </Modal>
  );
}
