import type { KnowledgeTree, Workspace } from "./types.ts";
import type { StorageAdapter } from "./storage.ts";
import { DataError, isRecord, validateTree } from "./validation.ts";

/**
 * Legacy garden data (the retired community prototype) is never edited by this
 * release, but the attachment bytes it references must survive cleanup and
 * travel inside full backups. This module is the single reader of that data.
 */
export const RETAINED_GARDEN_KEY = "leo-tree-gardens-v1";

/** The garden JSON the workspace owns: carried in `retainedGardenData` once restored, else still under its legacy key. */
export function retainedGardenRaw(ws: Workspace, adapter: StorageAdapter): string | null {
  if (Object.hasOwn(ws, "retainedGardenData")) {
    const value = ws.retainedGardenData;
    return typeof value === "string" ? value : null;
  }
  return adapter.read(RETAINED_GARDEN_KEY);
}

/** Every attachment ID the garden data references. Throws `DataError` on unreadable or unrecognised data. */
export function gardenReferences(raw: string | null): Set<string> {
  const refs = new Set<string>();
  if (raw === null) return refs;
  let state: unknown;
  try { state = JSON.parse(raw); } catch { throw new DataError("SCHEMA_INVALID", "Garden data is corrupt; export its raw source before continuing"); }
  if (!isRecord(state) || !Array.isArray(state.gardens) || !Array.isArray(state.planted)) throw new DataError("SCHEMA_INVALID", "Invalid garden metadata");
  for (const garden of state.gardens) {
    const cover = coverId(garden);
    if (cover) refs.add(cover);
  }
  for (const planted of state.planted) {
    if (!isRecord(planted) || !validateTree(planted.snapshot).valid) throw new DataError("RELATION_INVALID", "Invalid retained garden snapshot");
    for (const n of (planted.snapshot as KnowledgeTree).nodes) for (const a of n.attachments ?? []) refs.add(a.id);
  }
  return refs;
}

/** The blob ID behind a `cover:<id>` garden art reference, or null. */
export function coverId(garden: unknown): string | null {
  if (!isRecord(garden) || typeof garden.art !== "string" || !garden.art.startsWith("cover:")) return null;
  return garden.art.slice("cover:".length);
}
