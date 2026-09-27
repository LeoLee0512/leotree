import assert from "node:assert/strict";
import { test } from "node:test";
import { addNode, createBlankTree, resetCurrentTreeProgress, setNodeStatus } from "./engine.ts";
import { emptyWorkspace } from "./factory.ts";
import { memoryBlobStore } from "./files.ts";
import { gardenReferences } from "./gardens.ts";
import { ACTIVE_KEY, encodeRecord, loadWorkspace, memoryAdapter, recoveryCandidates } from "./storage.ts";
import { memoryExclusive, WorkspaceService, type Exclusive } from "./service.ts";
import { validateTree } from "./validation.ts";

function seeded() {
  const ws = addNode(createBlankTree(emptyWorkspace(), "A"), "sec-1");
  const treeId = ws.currentTreeId!;
  return { ws, treeId, nodeId: ws.trees[treeId].nodes[0].id };
}

test("F03: a tab stuck on RECOVERY_REQUIRED becomes editable once a peer activates a recovery copy", async () => {
  const { ws } = seeded();
  const adapter = memoryAdapter({ [ACTIVE_KEY]: "{broken", "knowledge-tree-workspace-v3": JSON.stringify(ws) });
  const exclusive = memoryExclusive();
  const stuck = new WorkspaceService({ adapter, blobs: memoryBlobStore(), exclusive, delay: 60000 });
  const peer = new WorkspaceService({ adapter, blobs: memoryBlobStore(), exclusive, delay: 60000 });
  assert.equal(stuck.getSnapshot().status, "RECOVERY_REQUIRED");
  stuck.bind(stuck.getSnapshot().workspace)("createBlankTree", "blocked");
  assert.equal(stuck.getSnapshot().errorCode, "RECOVERY_REQUIRED");
  assert.equal(await peer.recover(recoveryCandidates(adapter)[0].workspace!, true), true);
  await stuck.refresh();
  assert.equal(stuck.getSnapshot().status, "SAVED");
  assert.equal(stuck.getSnapshot().recovery, null);
  stuck.bind(stuck.getSnapshot().workspace)("createBlankTree", "after recovery");
  assert.equal(await stuck.flush(), true);
  assert.equal(Object.keys(loadWorkspace(adapter).trees).length, 2);
});

test("F08: discarding a draft while a commit is in flight keeps that commit and drops only what came after", async () => {
  const { ws, treeId, nodeId } = seeded();
  const adapter = memoryAdapter({ [ACTIVE_KEY]: encodeRecord(ws, 1) });
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  const slow: Exclusive = async work => { await gate; return work(); };
  const service = new WorkspaceService({ adapter, blobs: memoryBlobStore(), exclusive: slow, delay: 60000 });
  service.bind(service.getSnapshot().workspace)("patchNode", nodeId, { note: "committed" });
  const inFlight = service.flush();
  const discard = service.discardDraft(true);
  release();
  assert.equal(await inFlight, true);
  await discard;
  assert.equal(loadWorkspace(adapter).trees[treeId].nodes[0].note, "committed");
  assert.equal(service.getSnapshot().workspace.trees[treeId].nodes[0].note, "committed");
  assert.equal(service.getSnapshot().status, "SAVED");
});

test("F07: corrupt retained garden data defers attachment cleanup and never blocks a knowledge save", async () => {
  const { ws, treeId, nodeId } = seeded();
  const adapter = memoryAdapter({ [ACTIVE_KEY]: encodeRecord({ ...ws, retainedGardenData: "{not json" }, 1) });
  const blobs = memoryBlobStore([["orphan", new Blob(["keep me"])]]);
  const service = new WorkspaceService({ adapter, blobs, exclusive: memoryExclusive(), delay: 60000 });
  service.bind(service.getSnapshot().workspace)("patchNode", nodeId, { note: "saved anyway" });
  assert.equal(await service.flush(), true);
  assert.equal(loadWorkspace(adapter).trees[treeId].nodes[0].note, "saved anyway");
  assert.equal(service.getSnapshot().status, "DEGRADED");
  assert.equal(service.getSnapshot().errorCode, "CLEANUP_DEFERRED");
  assert.equal(await (await blobs.get("orphan"))!.text(), "keep me");
  assert.throws(() => gardenReferences("{not json"), /corrupt/);
  assert.throws(() => gardenReferences(JSON.stringify({ gardens: [{ art: 5 }], planted: [{}] })), /snapshot/);
  assert.deepEqual([...gardenReferences(JSON.stringify({ gardens: [{ art: "cover:c1" }, { art: null }, "x"], planted: [] }))], ["c1"]);
});

test("F05: resetting progress appends history events so a complete history still replays to 未学", () => {
  const seed = seeded();
  const { nodeId, treeId } = seed;
  let ws = seed.ws;
  ws = setNodeStatus(ws, nodeId, "doing");
  ws = setNodeStatus(ws, nodeId, "done");
  const firstDoneAt = ws.trees[treeId].nodes[0].firstDoneAt;
  ws = resetCurrentTreeProgress(ws);
  const tree = ws.trees[treeId];
  assert.equal(tree.nodes[0].status, "todo");
  assert.equal(tree.nodes[0].firstDoneAt, firstDoneAt);
  const last = tree.learningHistory!.at(-1)!;
  assert.deepEqual([last.from, last.to, last.nodeId, last.firstDone], ["done", "todo", nodeId, false]);
  assert.equal(tree.historyComplete, true);
  assert.equal(validateTree(tree).valid, true);
  // Replaying the event log ends in the stored state.
  const replayed = new Map<string, string>();
  for (const h of tree.learningHistory!) replayed.set(h.nodeId, h.to);
  assert.equal(replayed.get(nodeId), "todo");
  // Nothing to reset leaves the history untouched.
  const again = resetCurrentTreeProgress(ws);
  assert.equal(again.trees[treeId].learningHistory!.length, tree.learningHistory!.length);
});
