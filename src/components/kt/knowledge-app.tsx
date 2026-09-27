import { DataBoundary, DataTools, useDataActions, useWorkspaceService, downloadData } from "./data-boundary";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { ConfirmCtx, ConfirmModal, type ConfirmRequest } from "./confirm";
import { TreePage } from "./tree-page";
import { WeekPage } from "./week-page";
import { LogPage } from "./log-page";
import { TreeSwitcher } from "./tree-switcher";
import { Modal } from "./modal";
import { dismissPeachBoot } from "./peach-boot";
import { SettingsPage } from "./settings";
import { InkDock, type ShellTab } from "./dock";
import { CommunityPreview } from "./community-preview";
import { GrovePage } from "./grove";
import { GatePage } from "./gate-page";
import { I18nProvider, useI18n } from "@/lib/i18n";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { enterGuest, leaveGuest, readGuest } from "@/lib/guest";
import { currentTree } from "@/lib/knowledge-tree/engine";
import {
  exportTree,
  exportWorkspace,
  filenameForTree,
} from "@/lib/knowledge-tree/storage";
import { progressOf } from "@/lib/knowledge-tree/progress";
import { weekIdFromDate } from "@/lib/knowledge-tree/dates";
import { getTemplate } from "@/lib/knowledge-tree/templates";

import { Welcome, type StartChoice } from "./welcome";
import { NewTreeDialog, TemplateDialog } from "./new-tree-dialog";
import { INTRO_KEY, LOCAL_HINT_KEY, readPreference, writePreference } from "@/lib/ui-preferences";
import { createTreeFromDraft } from "@/lib/create-tree-draft";

const download = downloadData;
const SHELL_TAB_KEY = "leo-shell-tab-v1";

function readShellTab(): ShellTab {
  const s = readPreference(SHELL_TAB_KEY);
  if (s === "mine" || s === "community" || s === "settings") return s;
  return "mine";
}

export function KnowledgeApp() {
  return (
    <I18nProvider>
      <DataBoundary><KnowledgeShell /></DataBoundary>
    </I18nProvider>
  );
}

function KnowledgeShell() {
  const { t } = useI18n();
  const { user, isPending } = useCurrentUserState();
  const service = useWorkspaceService();
  const { pickImport } = useDataActions();
  const workspaceState = useSyncExternalStore(service.subscribe, service.getSnapshot, service.getSnapshot);
  const { workspace: ws } = workspaceState;
  const [introDone,setIntroDone] = useState(() => readPreference(INTRO_KEY) === "done");
  const [creation,setCreation] = useState<{templateId?:string} | null>(null);
  const [templateOpen,setTemplateOpen] = useState(false);
  const [localHint,setLocalHint] = useState(false);
  const initiallyEmpty = useRef(Object.keys(ws.trees).length === 0);
  useEffect(() => {
    if(initiallyEmpty.current && Object.keys(ws.trees).length > 0 && workspaceState.status === "SAVED") {
      initiallyEmpty.current = false;
      if(readPreference(LOCAL_HINT_KEY) !== "shown") {setLocalHint(true);writePreference(LOCAL_HINT_KEY,"shown");}
    }
  },[ws.trees,workspaceState.status]);
  const commit = useMemo(() => service.bind(ws), [service,ws]);
  const [toast, setToast] = useState("");
  const toastTimer = useRef<number | null>(null);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameTitle, setRenameTitle] = useState("");
  const [renameDesc, setRenameDesc] = useState("");
  const [confirmReq, setConfirmReq] = useState<ConfirmRequest | null>(null);
  const [guest, setGuest] = useState(() => readGuest());
  const [groveOpen, setGroveOpen] = useState(true);
  const [shell, setShell] = useState<ShellTab>(readShellTab);
  const ask = (req: ConfirmRequest) => setConfirmReq(req);
  useEffect(() => {
    if(new URLSearchParams(window.location.search).get("start") === "web") {
      writePreference(INTRO_KEY,"done");setIntroDone(true);enterGuest();setGuest(true);
      setShell("mine");setGroveOpen(true);writePreference(SHELL_TAB_KEY,"mine");
    }
  },[]);
  useEffect(() => () => {
    if (toastTimer.current !== null) window.clearTimeout(toastTimer.current);
  }, []);
  function startUsing(choice:StartChoice) {
    writePreference(INTRO_KEY,"done");setIntroDone(true);enterGuest();setGuest(true);changeShell("mine");
    if(choice === "blank")setCreation({});
    if(choice === "template")setTemplateOpen(true);
    if(choice === "import")pickImport();
  }

  useEffect(() => {
    if (!isPending) dismissPeachBoot();
  }, [isPending]);

  useEffect(() => {
    if (user) {
      leaveGuest();
      setGuest(false);
    }
  }, [user]);

  function changeShell(next: ShellTab) {
    setShell(next);
    writePreference(SHELL_TAB_KEY, next);
  }

  function flash(msg: string) {
    setToast(msg);
    if (toastTimer.current !== null) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => {
      toastTimer.current = null;
      setToast("");
    }, 1800);
  }

  const tree = currentTree(ws);
  const tpl = getTemplate(tree?.templateId);

  function openGrove() {
    setGroveOpen(true);
  }
  function openTree(id: string) {
    commit("setCurrentTree", id);
    setGroveOpen(false);
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (ws.ui.switcherOpen) {
        commit("patchUi", { switcherOpen: false });
        return;
      }
      if (ws.ui.focusNodeId) commit("focusParent");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ws, commit]);

  if (isPending) return null;

  if (!user && !guest && !introDone && !Object.keys(ws.trees).length) return <Welcome onStart={startUsing}/>;

  if (!user && !guest) {
    return (
      <GatePage
        onGuest={() => {
          enterGuest();
          setGuest(true);
        }}
      />
    );
  }

  const creationUi = <>
    {creation && <NewTreeDialog templateId={creation.templateId} onClose={()=>setCreation(null)} onEnter={(title,description)=>{
      if(createTreeFromDraft(service,title,description,creation.templateId)) {setCreation(null);setGroveOpen(false);}
    }}/>}
    {templateOpen && <TemplateDialog onClose={()=>setTemplateOpen(false)} onPick={id=>{setTemplateOpen(false);setCreation({templateId:id});}}/>}
    {localHint && <aside className="local-first-reminder" role="status"><p>{t("localFirstReminder")}</p><button className="btn" onClick={()=>setLocalHint(false)}>{t("gotIt")}</button></aside>}
  </>;
  const chrome = (
    <>
      <InkDock tab={shell} onChange={changeShell} />
      {creationUi}
      <div className={`toast ${toast ? "show" : ""}`}>{toast}</div>
      <ConfirmModal req={confirmReq} onClose={() => setConfirmReq(null)} />
    </>
  );

  if (shell === "community" || shell === "settings") {
    return (
      <ConfirmCtx.Provider value={ask}>
        <div className="wrap shell-wrap">
          {shell === "community" ? (
            <CommunityPreview onReturn={() => changeShell("mine")} />
          ) : (
            <SettingsPage
              ws={ws}
              commit={commit}
              guest={guest}
              onLeaveGuest={() => {
                leaveGuest();
                setGuest(false);
              }}
              onOpenTree={() => {
                setGroveOpen(false);
                changeShell("mine");
              }}
            />
          )}
        </div>
        {chrome}
      </ConfirmCtx.Provider>
    );
  }

  if (groveOpen || !tree) {
    return (
      <ConfirmCtx.Provider value={ask}>
        <div className="wrap landing">
          <GrovePage
            ws={ws}
            onOpen={openTree}
            onNewBlank={() => setCreation({})}
            onFromTemplate={(id) => setCreation({templateId:id})}
            onImport={() => pickImport()}
          />
        </div>
        {chrome}
      </ConfirmCtx.Provider>
    );
  }

  const tot = progressOf(tree.nodes);
  const weekId = ws.ui.weekId || weekIdFromDate();

  return (
    <ConfirmCtx.Provider value={ask}>
    <div className="wrap">
      <header className={`hero ${ws.ui.focusNodeId ? "compact" : ""}`}>
        <div>
          <button type="button" className="brand-mark brand-home" onClick={openGrove}>
            LEO TREE
          </button>
          <h1>{tree.title || t("untitled")}</h1>
          {tree.description ? <p>{tree.description}</p> : null}
          <div className="hero-wave" aria-hidden="true" />
          <button className="tree-switch" onClick={() => commit("patchUi", { switcherOpen: true })}>
            {t("switchTree")} ▾
          </button>
        </div>
        <div className="hero-actions">
          <button
            className={`btn ${ws.ui.editing ? "on" : ""}`}
            onClick={() => commit("patchUi", { editing: !ws.ui.editing, tab: "tree" })}
          >
            {ws.ui.editing ? t("doneEdit") : t("editStructure")}
          </button>
          <button className="btn" onClick={() => download(filenameForTree(tree.title), exportTree(ws, tree.id))}>
            {t("exportTree")}
          </button>
          <button className="btn" onClick={() => download("knowledge-tree-workspace.json", exportWorkspace(ws))}>
            {t("exportAll")}
          </button>
          <button className="btn" onClick={() => pickImport()}>
            {t("import")}
          </button>
          <button
            className="btn danger"
            onClick={() => {
              ask({
                title: t("clearProgressTitle"),
                body: t("clearProgressBody"),
                confirmLabel: t("clearProgressOk"),
                onConfirm: () => {
                  commit("resetCurrentTreeProgress");
                  flash(t("cleared"));
                },
              });
            }}
          >
            {t("clearProgress")}
          </button>
        </div>
      </header>
      <nav className="tabs" role="tablist" aria-label={t("knowledgeTree")}>
        {(["tree", "week", "log"] as const).map((tab) => (
          <button
            key={tab}
            role="tab"
            aria-selected={ws.ui.tab === tab}
            className={`tab ${ws.ui.tab === tab ? "on" : ""}`}
            onClick={() => commit("patchUi", { tab, editing: tab === "tree" ? ws.ui.editing : false })}
          >
            {tab === "tree" ? t("tabTree") : tab === "week" ? t("tabWeek") : t("tabLog")}
          </button>
        ))}
      </nav>
      {ws.ui.tab === "tree" && <TreePage ws={ws} tree={tree} tot={tot} commit={commit} />}
      {ws.ui.tab === "week" && <WeekPage ws={ws} tree={tree} weekId={weekId} commit={commit} flash={flash} />}
      {ws.ui.tab === "log" && <LogPage ws={ws} tree={tree} commit={commit} flash={flash} />}
      <p className="foot">
        {t("foot")}
        {tpl && tpl.id !== "blank" ? ` · ${t("template")} ${tpl.title}` : ""}
      </p>
      {ws.ui.switcherOpen && (
        <TreeSwitcher
          ws={ws}
          commit={commit}
          onImport={pickImport}
          onCreate={(templateId)=>{commit("patchUi",{switcherOpen:false});setCreation({templateId});}}
          onClose={() => commit("patchUi", { switcherOpen: false })}
          onRename={(id) => {
            const target = ws.trees[id];
            setRenameId(id);
            setRenameTitle(target?.title ?? "");
            setRenameDesc(target?.description ?? "");
          }}
        />
      )}
      {renameId && (
        <Modal title={t("renameTree")} onClose={() => setRenameId(null)}>
            <div className="form">
              <label>{t("name")} <input value={renameTitle} onChange={(e) => setRenameTitle(e.target.value)} /></label>
              <label>{t("intro")} <textarea value={renameDesc} onChange={(e) => setRenameDesc(e.target.value)} /></label>
              <button className="btn primary" onClick={() => { commit("renameTree", renameId, renameTitle, renameDesc); setRenameId(null); }}>
                {t("save")}
              </button>
            </div>
        </Modal>
      )}
      <DataTools />
    </div>
    {chrome}
    </ConfirmCtx.Provider>
  );
}
