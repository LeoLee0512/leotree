import type { WorkspaceService } from "./knowledge-tree/service";

// UI composition of existing commands; the audited mutation boundary stays intact.
export function createTreeFromDraft(service: WorkspaceService, title: string, description: string, templateId?: string): string | null {
  const before=service.getSnapshot().workspace;
  const create=service.bind(before);
  const name=title.trim() || "未命名";
  if(templateId) create("createTreeFromTemplate",templateId,name);
  else create("createBlankTree",name);
  const next=service.getSnapshot().workspace;
  const id=next.currentTreeId;
  if(!id || before.trees[id]) return null;
  // The create command already carries the title; only a non-empty description needs a second command.
  const brief=description.trim();
  if(brief) service.bind(next)("renameTree",id,name,brief);
  return id;
}
