# Schema index

- `src/lib/knowledge-tree/types.ts`: domain schema 3, tree-scoped node identity, history provenance.
- `validation.ts`: workspace/tree schema and graph checks; contiguous normalizable order.
- `migrate.ts`: deterministic v3/v2 candidates; malformed/future data never silently overwrites its source.
- `storage.ts`: envelope format 1 and revision; `backup.ts`: versioned manifest and hashes.
- `templates/`: blank and SNN seed data; `templates/standard-empty-knowledge-tree.json` at the repository root is the exported standard blank tree.
- `migrations/0001_auth.sql`: the Better Auth schema applied by both PGLite and Postgres.

Import/recovery validate before explicit commit. Ordinary content patches cannot change identity, hierarchy or status.
