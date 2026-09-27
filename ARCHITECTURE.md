# Leo Tree architecture

React 19 / TanStack Start / Vite / Nitro (node-server preset). Pure domain functions and a `StorageAdapter`. Tree → Section → flat `Node[]` + `parentId` supports arbitrary depth. Node identity is (treeId, nodeId). SNN is template data.

## Writes and recovery

`knowledge-app.tsx` subscribes to `WorkspaceService` (`src/lib/knowledge-tree/service.ts`). Components submit named commands through `operations.ts`, never workspace snapshots. Search, filter, selected tree, focus and dialogs are view state; text commands coalesce for 300 ms.

The service takes a Web Lock, rereads the latest revision, checks command preconditions, applies pure engine functions, validates, stages immutable bytes in IndexedDB, then atomically swaps the active localStorage envelope. BroadcastChannel and storage events refresh peers; a peer that activated a recovery copy also unblocks tabs stuck in `RECOVERY_REQUIRED`. Conflicts and failures retain drafts and expose retry/rescue. Missing Web Locks disables unsafe writes.

- `validation.ts` checks schema and domain relationships.
- `storage.ts` owns typed reads, revision compare-and-swap, last-good candidates and raw recovery copies.
- `migrate.ts` validates v3/v2 candidates without writing on read.
- `import.ts` separates independent import, restore and merge and requires an unchanged confirmed preview.
- `backup.ts` hashes and validates ZIP payloads before activation.
- `files.ts` stores immutable Blobs; `cover-draft.ts` keeps cancelled selections in memory.
- `gardens.ts` is the single reader of retained legacy garden data, so its attachment references survive cleanup and travel in backups.
- `history.ts` keeps learning facts append-only (a reset is recorded as events, `firstDoneAt` survives); `progress.ts` separates historical totals from current diagnostics.

Active key `leo-tree-workspace-v1`, envelope format 1, domain schema 3. `knowledge-tree-workspace-v3` and v2 keys remain legacy read sources. Attachment database `leo-tree-files-v1`, store `blobs`. See [data protocol](docs/DATA_SAFETY_PROTOCOL.md).

## UI

`tree-page.tsx` links search → node → practice → review → node. `week-page.tsx` and `log-page.tsx` hold the weekly review and practice log; `tree-switcher.tsx` the tree list dialog. `grove.tsx`, `community-preview.tsx`, `settings.tsx` implement the three destinations. `data-boundary.tsx` owns the save-state bar, recovery page, import and restore dialogs. All user-facing text goes through `src/lib/i18n.tsx` (zh / en); storage error codes are explained by `src/lib/user-messages.ts`.

Native `<dialog>` modals provide Escape, focus containment and restoration; popovers stay within the viewport. The old standalone SNN URL is a script-free redirect with its original archived under `docs/archive/`.

## Accounts

`src/lib/auth/` is a minimal Better Auth setup: local email/password only, over PGLite (`src/lib/db.ts`, `LEOTREE_PGLITE_PATH`) or Postgres (`DATABASE_URL`). It is enabled only when `LEOTREE_EMAIL_AUTH=true`, a persistent database, a stable `BETTER_AUTH_SECRET` and a valid `BETTER_AUTH_URL` are all present (`config.ts`); the client asks `/api/auth/capabilities` at runtime and shows the form only on a positive answer. No OAuth, no platform identity gate, no third-party scripts. Knowledge never enters the SQL database.

## Build and verification

`vite.config.ts` bootstraps PGLite during dev and traces the PGLite package into the Nitro output so WASM/data survive extraction; `scripts/verify-build.mjs` rejects dependencies resolved outside the output. Product tests discover `src/lib/**/*.test.ts`; tooling tests are `scripts/*.test.mjs`. Production browser scripts cover data failures, learning loops, accounts and real browser/server restart. See [tests/README.md](tests/README.md).
