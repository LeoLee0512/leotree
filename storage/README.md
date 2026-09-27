# Storage index

Active code lives under `src/lib/knowledge-tree/`:

- `service.ts`, `operations.ts`: commands, field preconditions, Web Locks, revision checks, drafts and peer refresh.
- `storage.ts`: adapter, active envelope, last-good and raw recovery copies, typed failures.
- `migrate.ts`: candidate migration; `import.ts`: conflict preview and explicit activation.
- `files.ts`: immutable IndexedDB transactions; `cover-draft.ts`: cancellation without writes.
- `backup.ts`: ZIP manifest, hashes, validation and restore.
- `gardens.ts`: reads retained legacy garden data (`leo-tree-gardens-v1` or `retainedGardenData`) so its attachments are kept and backed up.

Guest flag and UI preferences (`src/lib/guest.ts`, `src/lib/ui-preferences.ts`) are separate localStorage keys. `src/lib/db.ts` serves the optional account database only, never knowledge. See [protocol](../docs/DATA_SAFETY_PROTOCOL.md).
