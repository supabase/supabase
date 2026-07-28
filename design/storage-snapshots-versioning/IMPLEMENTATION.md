# Studio implementation notes — Snapshots & Versioning demo

Real Studio components wired to a **mock data layer**, implementing the five
designs exported from Claude Design (`Storage Snapshots & Versioning.dc.html`).
Everything is gated behind a single prototype flag so production behavior is
unchanged when it's off.

## How to run / toggle

```bash
pnpm dev:studio          # http://localhost:8082 → open a project → Storage
```

The demo is force-enabled via `STORAGE_PROTECTION_ENABLED` in
`apps/studio/components/interfaces/Storage/StorageProtection.constants.ts`.
Flip it to `false` to hide every surface (a real rollout would swap it for
`useFlag('storageObjectVersioning')`).

## Mock data layer

No platform API exists yet, so these hooks return deterministic in-memory data
(shaped exactly like real Studio query/mutation hooks so a real fetcher is a
localized swap later):

- `data/storage/protection/protection-mocks.ts` — types + sample data
- `data/storage/protection/object-versions-query.ts` — versions + restore
- `data/storage/protection/bucket-snapshots-query.ts` — list + create + restore
- `data/storage/protection/bucket-trash-query.ts` — list + restore
- `data/storage/protection/storage-retention-usage-query.ts` — usage breakdown
- query keys added to `data/storage/keys.ts`

## Design → files

| Design | Where | Key files |
| --- | --- | --- |
| **Data protection modal** | Create/Edit bucket → new "Data protection" section | `BucketDataProtectionFields.tsx`, wired into `CreateBucketModal.tsx` + `EditBucketModal.tsx`. Cut back to a single switch, "Include in snapshots" (defaults to *in*) — versioning on/off, retention override, expiry days, and max versions were removed as a footgun at bucket-creation time; versioning still applies at the project default |
| **Snapshot lifecycle policy** | Storage → Files → **Settings** | `StorageSettings/RestorePointsSettings.tsx` — canonical project-level editor (retention, include-new-buckets, per-bucket participation). Displayed as "Snapshot lifecycle"; the component/file/hook names still say "RestorePoint*" internally — only the visible copy moved away from that term. Frequency is shown as a static value ("With every database backup"), not editable — `SnapshotFrequency` is now a single-value type |
| **Snapshots (2a)** | Storage → Files → **Snapshots** tab (`/storage/files/snapshots`) | `Snapshots/Snapshots.tsx`, `SnapshotsList.tsx`, `TakeSnapshotModal.tsx`, `RestoreSnapshotModal.tsx`; page `pages/project/[ref]/storage/files/snapshots/index.tsx` (+ route) |
| **Versions tab (3a)** | Storage explorer → select a file → preview pane | `StorageExplorer/VersionHistory.tsx`, tabs added to `StorageExplorer/PreviewPane.tsx`. Tabs sit below the preview thumbnail (not at the top); clicking a version row previews it above with a "Previewing version…／Back to latest" banner |
| **Storage size breakdown (4a)** | Org → **Usage** page | `StorageRetentionUsage/StorageRetentionUsage.tsx`, mounted in `Organization/Usage/Usage.tsx` |
| **Deleted files (6a)** | Storage → Files → **Deleted files** tab (`/storage/files/trash`) | `Trash/Trash.tsx`, `TrashList.tsx`; page `pages/project/[ref]/storage/files/trash/index.tsx` (+ route) — internal naming ("Trash") kept for the component/route, only the displayed label changed |
| Nav | Snapshots + Deleted files as **Files sub-tabs** (not sidebar items — they're views over file buckets, not a bucket type) | `StorageLayout/StorageBucketsLayout.tsx` |
| Shared | Bucket picker for Snapshots/Deleted files | `StorageBucketSelector.tsx` |

## Verification status

`pnpm typecheck` / `pnpm --filter studio lint:ratchet` **could not be run in the
build sandbox** — `pnpm install` is blocked by an org egress policy that returns
`403` for the JSR registry (`npm.jsr.io`), so `node_modules` can't be populated.
Please run both locally:

```bash
pnpm install
pnpm typecheck
pnpm --filter studio lint:ratchet
```

The code was written against the ratcheted rules (no `any`, no `useEffect`
data-deriving, a11y labels on inputs, named exports outside `pages/**`) and
verified against the real component APIs (`Button` `variant`, `Badge` variants,
unsuffixed `ui` primitives, `ConfirmationModal`/`Admonition` props).

## Not persisted (prototype scope)

Toggling protection in the modal, taking/restoring snapshots, restoring
versions, and restoring/purging trash all run through mock mutations (optimistic
toasts + query invalidation) — nothing hits a real backend yet.
