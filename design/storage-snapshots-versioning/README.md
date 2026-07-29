# Storage Snapshots & Versioning — Design Proposal

**Status:** Design exploration / prototype
**Author:** Design Engineering
**Surface:** `apps/studio` → Storage product
**Companion artifact:** [`prototype.html`](./prototype.html) — open in a browser for the clickable, Studio-themed mockups.

---

## 0. TL;DR

Two independent, per-bucket, opt-in features:

| Feature | Grain | Recovers | New surface |
| --- | --- | --- | --- |
| **Object versioning** | Single object | An overwritten or deleted file | Version history drawer in the explorer + a **Trash** for soft-deletes |
| **Bucket snapshots** | Whole bucket at a point in time | An entire bucket to a known-good state | A **Snapshots** section in the Storage nav + alignment with DB backups |

The single hardest design problem, per the PRFAQ's own "Why we shouldn't build this", is **legibility of cost and lifetime**: a customer must be able to answer *"when is my object truly gone, and when do I stop paying for it?"* without reading docs. Every screen below is designed backwards from that question — retained-but-billable data is always labelled, attributed, and traceable to the version or snapshot that is holding it.

---

## 1. Where this slots into today's Storage product

Grounding references (so the design stays faithful to existing patterns):

- **Product nav** — `apps/studio/components/interfaces/Storage/StorageMenuV2.tsx`. A `Menu type="pills"` with a **Manage** group (Files / Analytics / Vectors) and a **Configuration** group (S3).
- **Bucket create/edit** — `CreateBucketModal.tsx` / `EditBucketModal.tsx`: `Dialog` + react-hook-form + zod, `DialogSectionSeparator` between blocks, `Switch`-gated sub-fields, `Admonition` warnings.
- **Explorer** — `StorageExplorer/StorageExplorer.tsx` (header + `FileExplorer` + `PreviewPane`), rows in `FileExplorerRow.tsx`, row actions via the reusable `FileExplorerRowContextMenu.tsx` provider, right details panel `PreviewPane.tsx` (fixed 450 px).
- **Destructive confirm** — `TextConfirmModal` (type-to-confirm), as in `DeleteBucketModal.tsx`.
- **Usage** — `Organization/Usage/*`: `AttributeUsage.tsx` (a `SparkBar` + "Included / Used / Overage" table + `UsageBarChart` stacked Recharts). Storage size metric is `PricingMetric.STORAGE_SIZE` (`org-daily-stats-query.ts`), rendered as a single white bar today (no sub-breakdown).
- **DB backups** — `Database/Backups/BackupsList.tsx` + `BackupItem.tsx` (scheduled), `PITR/PITRForm.tsx` (calendar + timezone + time picker), restore via `ConfirmationModal variant="warning"`.
- **Reusable charts** — `components/ui/Charts/StackedBarChart.tsx`, `AreaChart.tsx`; `SparkBar.tsx`.

### Proposed nav change

Add **Snapshots** to the **Manage** group in `StorageMenuV2`, and expose per-object version history inside the existing explorer. No new top-level product; snapshots and versions live *inside* Storage where the mental model already is.

```
Storage
  MANAGE
    Files
    Snapshots        ← new
    Analytics
    Vectors
  CONFIGURATION
    S3
```

Snapshots is nav-level (not a sub-tab of Files) because a snapshot is a bucket-wide, cross-cutting artifact that also participates in the database-backup flow — it deserves its own home. Versioning, by contrast, is per-object and belongs *in* the file explorer, not a separate page.

---

## 2. Deliverable 1 — How to enable snapshots / object-versioning

**Principle:** opt-in lives exactly where buckets are already configured. No new settings page, no migration prompt.

### 2.1 In the Create / Edit bucket modal

Add one new `DialogSection` — **"Data protection"** — after the MIME-types section in both `CreateBucketModal.tsx` and `EditBucketModal.tsx`, following the identical `Switch` + `FormItemLayout layout="flex"` + reveal-on-toggle pattern already used for "Restrict file size":

```
┌─ Data protection ───────────────────────────────────────────┐
│  Object versioning                              [ ●   ] on   │
│  Keep previous versions when an object is overwritten or     │
│  deleted, so you can restore them later.                     │
│                                                              │
│    ▸ (revealed when on) Lifecycle for noncurrent versions    │
│      ◉ Keep indefinitely   ○ Expire after [ 30 ] days        │
│      Retain at most [ 10 ] newer noncurrent versions (max 100)│
│                                                              │
│  ──────────────────────────────────────────────────────     │
│  Bucket snapshots                               [   ● ] off  │
│  Capture the whole bucket at a point in time so you can      │
│  restore it later — and align it with database backups.      │
│                                                              │
│    ▸ (revealed when on)                                       │
│      ☑ Snapshot before every scheduled database backup       │
│      Expire snapshots after [ 90 ] days   ○ Keep indefinitely │
└──────────────────────────────────────────────────────────────┘
```

Copy rules (per `copywriting` skill — sentence case, no jargon):
- Toggle labels are the feature name only ("Object versioning", "Bucket snapshots").
- The description answers *what it does for me*, not *how it works*.
- Retention inputs mirror the External FAQ exactly: "Expire noncurrent versions after N days", "Retain at most N newer noncurrent versions (up to 100)".

### 2.2 The one hard truth, stated at enable time

Because "deleted" changes meaning once enabled, the toggle **on** state renders an inline `Admonition type="default"` (not warning — it's expected behavior, not danger):

> Once enabled, deleting or overwriting an object keeps the previous copy. Retained copies still count toward storage usage until a lifecycle policy or a manual delete removes them. [View what's retained →]

This is the single most important piece of copy in the whole feature. It is repeated verbatim on the usage breakdown and the trash.

### 2.3 Suspending, not disabling (External FAQ)

Versioning can only be **suspended**, never turned off destructively. In `EditBucketModal`, once versioning has ever been enabled, the toggle label becomes **"Object versioning"** with a state chip: `Enabled` / `Suspended`. Flipping it off opens a small confirm:

> Suspend versioning? Existing versions are kept and remain billable. New uploads and deletes will stop creating versions. You can re-enable at any time.

### 2.4 Bucket list affordances

In `FilesBuckets/BucketTable.tsx`, add two lightweight `Badge`s in the Name cell (next to the existing "Public" badge): `Versioned` and `Snapshots`. This makes protection status scannable across all buckets without opening each one.

---

## 3. Deliverable 2 — Visualize / navigate / interact with object versions

**Principle:** versions are an *attribute of an object*, so they live in the explorer, surfaced through the pane the user already uses to inspect a file — `PreviewPane.tsx`.

### 3.1 Row affordance

In `FileExplorerRow.tsx`, when a versioned file has >1 version, render a subtle count chip after the name: `v3` (mono, `text-foreground-lighter`). Hover tooltip: "3 versions · latest 2d ago". Soft-deleted objects never appear in the normal explorer — they live in the Trash (§8).

### 3.2 Version history — extend the Preview pane

Add a **"Version history"** disclosure to `PreviewPane.tsx`, below the existing metadata block. It lists versions newest-first; each entry is a `version_id` (short), size, timestamp, and author, with the current one badged `Current`:

```
Version history                                       3 versions
─────────────────────────────────────────────────────────────
● v3  1a2b3c…   412 KB   Current    2d ago   uploaded
   … ⋯  Download · Get URL
  v2  9f8e7d…   398 KB              6d ago   overwritten
   … ⋯  Download · Restore this version · Delete version
  v1  4c5d6e…   405 KB             14d ago   created
   … ⋯  Download · Restore this version · Delete version
```

Interactions per version (reusing the existing `DropdownMenu` / `FileExplorerRowContextMenu` `RowOption[]` model):
- **Download** — fetches that specific `version_id`.
- **Restore this version** — promotes an older version to become current (creates a new current version pointing at the old bytes; non-destructive). Confirmation is a lightweight `ConfirmationModal`, not type-to-confirm — it's reversible.
- **Delete version** — removes a single noncurrent version. `ConfirmationModal variant="warning"`; if the version is referenced by a snapshot, it is **blocked** with an explanation (see §3.4).
- **Get URL** — reuses `useCopyUrl` with `?version=` appended.

### 3.3 "Show versions" as a first-class explorer mode

Add a toggle in `FileExplorerHeader` (next to the columns/list view switch): **"Show all versions"**. When on, the list view expands each object into its version rows inline (indented, mono `version_id`), so power users can audit an entire folder's history without clicking file-by-file. This mirrors S3 console's "Show versions" toggle, which is the closest existing mental model for the target user.

### 3.4 The retention truth, at the point of action

When a user tries to **Delete version** or **Delete file** and that data is pinned by a snapshot, we do **not** silently keep it. We block and explain, because surprise retention is the #1 risk:

> Can't fully delete yet — this version is part of snapshot **`snap_2026-07-20`** (expires in 12 days). It will be removed automatically when that snapshot expires, or you can delete the snapshot now. [Go to snapshot →]

This directly implements the External FAQ ("If an object belongs to a snapshot, the object can't be deleted until the corresponding snapshot is deleted") and turns an invisible billing surprise into a visible, actionable state.

---

## 4. Deliverable 3 — Visualize / navigate / interact with snapshots

**Principle:** a snapshot is a bucket-wide, immutable point-in-time capture. It gets its own nav section (`/storage/snapshots`) built on the existing list-page pattern (`PageContainer` + search + sort + `Card`-wrapped `@tanstack/react-table`, as in `FilesBuckets/index.tsx`).

### 4.1 Snapshots list

Columns:

| Snapshot | Bucket | Objects | Size held | Source | Created | Expires |
| --- | --- | --- | --- | --- | --- | --- |
| `snap_2026-07-24_0300` | `avatars` | 1,204 | 1.8 GB | DB backup | 2d ago | in 88 days |
| `pre-migration` | `avatars` | 1,190 | 1.7 GB | Manual | 5d ago | Never · ⚠ |

- **"Size held"** is the design's honesty column: it's the bytes retained *only because this snapshot exists* (i.e. data a lifecycle policy or a delete would otherwise have removed). This is what the customer is paying extra for. A snapshot whose objects are all still live shows `0 B held`.
- **Source** badge: `DB backup` (auto, taken before a scheduled database backup) vs `Manual`.
- **Expires** with `Never` rendered with a small ⚠ affordance, since indefinite retention is the cost trap.

Toolbar: **"Take snapshot"** button (primary), bucket filter, search.

### 4.2 Take a snapshot

A `Dialog` (not full page): pick bucket(s) with snapshotting enabled, optional name, optional expiry (defaults to the bucket's snapshot lifecycle policy). A live estimate: "Captures 1,204 objects (current versions only). Est. additional storage held: ~1.8 GB." The "current versions only" line is load-bearing — it pre-empts the External FAQ question "Do snapshots capture prior versions?".

### 4.3 Snapshot detail

Opening a snapshot shows a read-only, point-in-time browser (the same `FileExplorer` component in a read-only mode) plus a right rail with:
- Summary: objects, total size, size *uniquely* held, source, created, expires.
- **Restore this snapshot** (primary, `variant="warning"` flow — see §5).
- **Edit expiry** / **Delete snapshot** (type-to-confirm `TextConfirmModal`, because deleting a snapshot can hard-delete the objects it was pinning).
- A "What restoring does" explainer: restoring makes the bucket match this snapshot — objects not in the snapshot are removed, changed objects revert. This is the one-way-door contract from the Internal FAQ, surfaced in-product.

### 4.4 Restoring (standalone)

Restore is destructive to the *current* bucket state, so it uses the warning-confirmation pattern from `BackupsList.tsx`: a `ConfirmationModal variant="warning"` listing exactly what will change:

> Restoring **`snap_2026-07-20`** to bucket **`avatars`**:
> - 14 objects added back
> - 3 objects reverted to earlier content
> - 22 objects created after the snapshot will be **removed**
> This can't be undone. [Type the bucket name to confirm]

Computing and showing the diff (added / reverted / removed counts) before restore is what makes a whole-bucket restore trustworthy.

---

## 5. Deliverable 4 — How snapshots interplay with database backups

**Principle:** the headline value ("recover DB and storage to the same point in time") should require *zero* new behavior — it piggybacks on the existing scheduled-backup flow.

### 5.1 Enablement

The "Snapshot before every scheduled database backup" checkbox (§2.1) is the entire opt-in. Once checked on any snapshot-enabled bucket, every scheduled DB backup is preceded by a bucket snapshot tagged `Source: DB backup` and correlated by timestamp.

### 5.2 In the Database → Backups UI

Extend `Database/Backups/BackupItem.tsx`. Each scheduled backup row that has correlated storage snapshots gains:
- A `Storage snapshot` badge with a count (e.g. `2 buckets`).
- The **Restore** confirmation (`ConfirmationModal` in `BackupsList.tsx`) gains a checkbox, checked by default:

> ☑ **Also restore storage** to the matching snapshot from this point in time
> Buckets: `avatars`, `uploads` · ~3.1 GB
> Restoring storage will overwrite current objects to match the snapshot. Uncheck to restore the database only.

This is the exact customer-journey moment from the Press Release: "when she restores the database backup it also restores the corresponding storage snapshot to the same point in time." The checkbox (rather than automatic) respects that some users genuinely want DB-only.

### 5.3 The mismatch we prevent, made visible

When storage restore is **unchecked**, show an inline `Admonition type="warning"`:

> Restoring the database without storage may leave records that reference files that no longer exist (or the reverse). Keep this checked to restore both to the same point in time.

This names the exact drift problem from the "Why Us?" section, at the exact moment it can be avoided.

### 5.4 PITR

For PITR (`PITRForm.tsx` calendar/time picker), continuous storage restore does **not** exist (rejected in Internal FAQ — snapshots are discrete). So when a user picks a PITR timestamp, we surface the **nearest storage snapshot** at or before that time and offer to restore it alongside, clearly labelled as approximate:

> Nearest storage snapshot: `snap_2026-07-24_0300` (3 h before your selected time). Storage can only restore to discrete snapshots, not the exact second.

Honesty about the discrete-vs-continuous gap prevents a false expectation that storage rewinds to the same second as the DB.

---

## 6. Deliverable 5 — Visualize how snapshots & versioning contribute to storage usage

**Principle:** this is the make-or-break surface. If a customer can't see *why* their bill grew, the feature generates support tickets instead of trust.

### 6.1 Break the single Storage Size bar into three attributes

Today `PricingMetric.STORAGE_SIZE` renders as one white bar in `AttributeUsage.tsx` via `UsageBarChart`. The stacked-bar infrastructure already exists (Egress is stacked into 7 segments in `Usage.constants.tsx`). We reuse it to split Storage Size into:

| Segment | Color intent | Meaning |
| --- | --- | --- |
| **Live objects** | brand green | current versions of non-deleted objects |
| **Prior versions** | amber | noncurrent versions kept by versioning |
| **Snapshots** | violet | bytes held *only* because a snapshot references them |

The over-time `UsageBarChart` becomes a 3-way stacked bar; the "Used in period" table gains the same three rows. A customer can now watch retained data grow day by day and correlate it with a delete/overwrite spike.

### 6.2 Per-bucket "what's driving this" — reuse the HoverCard

`BillingMetric.tsx` already has a `HoverCard` with a `project_allocations` table ("what's driving this usage"). We add an equivalent breakdown for Storage Size showing, per bucket: live / versions / snapshots bytes, so the answer to "which bucket is costing me and why" is one hover away.

### 6.3 A dedicated "Retained storage" callout in the bucket detail

On each versioning/snapshot-enabled bucket's detail header, a compact `SparkBar` + line:

> **2.4 GB** stored · 1.6 GB live, 0.5 GB prior versions, 0.3 GB held by snapshots. [Manage lifecycle]

This is the in-context, per-bucket answer to "when do I stop paying" — the SparkBar segments are clickable, deep-linking to the Trash (versions) or the Snapshots list filtered to that bucket.

### 6.4 The "truly gone" explainer

A persistent, dismissible info card on the usage page (and linked from every retention Admonition):

> **When is an object truly gone (and unbilled)?** An object stops counting toward storage only when *all* of these are true: it's not the current version, no lifecycle policy is retaining it, no snapshot references it, and it's not in the trash. [See what's retaining your objects →]

Making this single sentence answerable in-product is, per the PRFAQ, the primary rollout-risk mitigation.

---

## 7. Deliverable 6 — A "Trash" for soft-deleted files

**Principle:** a soft-deleted object is invisible in the normal explorer (so day-to-day browsing is clean) but must be trivially findable and restorable. The mental model users already have is a Trash / Recycle Bin.

### 7.1 Placement

A **Trash** view scoped per bucket, reached from:
- A `Trash` button in `FileExplorerHeader` (with a count badge when non-empty), and
- The bucket detail action dropdown.

Scoped per bucket (not global) because deletes, restores, and lifecycle all operate at bucket grain, and a global trash would blur which bucket's RLS/policies apply.

### 7.2 Layout

Reuse the list view of `FileExplorer` in a "trash mode":

| Name | Size | Deleted | Deleted by | Auto-removes |
| --- | --- | --- | --- | --- |
| `avatars/old.png` | 405 KB | 3d ago | jane@… | in 27 days |
| `docs/draft.pdf` | 1.2 MB | 8d ago | api key | in 22 days |

- **"Auto-removes"** is computed from the versioning lifecycle policy (or `Never` if none — flagged ⚠). This is the trash's version of the honesty column.
- Row actions: **Restore** (`ConfirmationModal`, reversible) and **Delete permanently** (`ConfirmationModal variant="warning"`; blocked with explanation if a snapshot pins it, per §3.4).
- Header actions: **Restore all**, **Empty trash** (`TextConfirmModal` type-to-confirm).

### 7.2b Batch selection and the "delete everything" action

Recovering from a bad delete usually means recovering *many* files, so single-row actions aren't enough. The list mirrors the file explorer's selection chrome rather than inventing a second pattern:

- **Checkbox on hover** per row (`opacity-0 group-hover:opacity-100`), staying visible once selected — same as `FileExplorerRow`.
- **Shift-click range selection** from the last-touched row, and a **select-all** checkbox in the header.
- **Bulk action bar** replacing the header when anything is selected — reuses the explorer's shared `bulkActionBarClassName`, shows "n items selected", and offers Restore / Delete permanently / clear.
- Snapshot-pinned files are counted separately in the bar ("3 held by a snapshot") and excluded from the delete, because the backend will refuse them. The confirm dialog says how many will be kept rather than silently deleting fewer than requested.

**On "Purge": don't use it.** Rejected for three reasons — it's jargon (the copy guide explicitly says to avoid it), it's vague about the outcome ("purge" doesn't say *permanently deleted*), and it introduces a third verb for an action already called "Delete permanently" on the row and in the confirm button. Options considered:

| Candidate | Verdict |
| --- | --- |
| **"Delete all permanently"** ✅ | Chosen. Matches the row action and confirm label exactly, states the outcome, no jargon. |
| "Empty" | Consistent with the existing "Empty bucket" action, but "Empty deleted files" doesn't parse, and it reads as reversible. |
| "Purge" | Jargon, vague, and a third synonym for the same operation. |
| "Delete forever" | Fine, but "permanently" is already the established word in this flow — one word, used consistently, beats two near-synonyms. |

The action is type-to-confirm (`TextConfirmModal`, bucket name), matching "Delete bucket" — the most destructive action in the feature gets the highest-friction confirmation.

### 7.3 Empty state

When versioning is enabled but nothing is deleted: "Nothing in the trash. Deleted objects will appear here and can be restored until a lifecycle policy removes them." When versioning is *off*: an empty state that explains deletes are permanent and offers to enable versioning.

---

## 8. CLI surface

The dashboard is for recovery-in-the-moment; the CLI is for automation and CI. Design goal: the version-ID scheme and command shape are a **one-way door** (Internal FAQ), so the surface below is deliberately minimal and S3-compatible in spirit.

```bash
# Enable / configure (per bucket)
supabase storage buckets update avatars --versioning enabled
supabase storage buckets update avatars --snapshots enabled --snapshot-on-db-backup
supabase storage buckets update avatars \
  --version-expiry-days 30 --max-noncurrent-versions 10 \
  --snapshot-expiry-days 90

# Object versions
supabase storage versions list avatars/profile.png
supabase storage versions get  avatars/profile.png --version-id 9f8e7d --output ./old.png
supabase storage versions restore avatars/profile.png --version-id 9f8e7d
supabase storage versions delete  avatars/profile.png --version-id 9f8e7d

# Trash (soft-deleted)
supabase storage trash list avatars
supabase storage trash restore avatars/old.png
supabase storage trash purge  avatars --older-than 30d

# Snapshots
supabase storage snapshots create  avatars --name pre-migration --expiry-days 90
supabase storage snapshots list    --bucket avatars
supabase storage snapshots show    snap_2026-07-24_0300
supabase storage snapshots restore snap_2026-07-24_0300 --dry-run   # prints add/revert/remove diff
supabase storage snapshots restore snap_2026-07-24_0300 --yes
supabase storage snapshots delete  snap_2026-07-24_0300
```

Design decisions:
- `--dry-run` on restore prints the same add/revert/remove diff the dashboard shows (§4.4) — trust parity between surfaces.
- `versions list` output includes a machine-readable `--output json` with `version_id`, `size`, `is_current`, `held_by_snapshot` so users can script the "is this billable" question.
- No `versioning disabled` — only `suspended`, matching the External FAQ one-way-door.

---

## 8b. Where should Backups live in the dashboard?

Raised once a backup's coverage became environment-wide: if a backup now covers Database, Auth, Storage, and Config, is `Database → Backups` still the right home?

**Recommendation: keep it under Database for now, but rename the page from "Database Backups" to "Backups."**

Reasons to stay:
- Restore risk still concentrates in the database, and the page is still ~90% database mechanics — PITR, physical vs logical, retention entitlements, read-replica constraints.
- It's where users already look. Every existing doc, support macro, and muscle-memory path points here; moving it buys confusion without buying capability.
- Auth and Storage metadata coverage is a *consequence* of Postgres being the source of truth. The page sitting next to the database reinforces that model rather than obscuring it.

What would change our mind — two plausible end states, both post-Select:
1. **A project-level "Recovery" section**, once Storage snapshots, config-from-git, and Compute state are all first-class inputs and the page is no longer database-dominated.
2. **Absorbed into Branches.** If restoring is primarily "create a branch from a past point, verify, promote," then backups and snapshots are a *time axis on branches* and belong beside them. The vision's framing — branching as a CoW primitive that everything inherits — points here.

Either way the trigger is the same: revisit when storage-level branching lands (2026–2027 per the engineering vision), because that's when "restore" stops being a database operation with attachments and becomes an environment operation.

Interim: keep the route, retitle the page, and make coverage explicit (done). Renaming is cheap and reversible; relocating is neither.

## 8c. Lifecycle policy: what belongs at which level

The PRFAQ describes two per-bucket opt-ins (versioning, snapshotting). The follow-up question was whether there's a third lever for **frequency and maximum life**, and whether that means three lifecycle policies per bucket: snapshots, current objects, prior versions.

### Two axes, not three policies

The three proposed policies aren't the same kind of thing:

| | Created by | Has a frequency? | Purpose |
| --- | --- | --- | --- |
| Prior versions | User action (overwrite/delete) | No | Recovery depth |
| Snapshots | A schedule | **Yes** | Recovery depth |
| Current objects | User action (upload) | No | Cost hygiene — *deliberate destruction* |

So the frequency instinct is right, but it applies to **only one** of the three: snapshots are the only scheduled artifact. Versions and current objects are created by user action and have retention only.

And **current-object expiry is a different product** (S3 lifecycle expiration). Grouping it here puts "keep my data safe" and "delete my data" on one screen, and it has a nasty interaction with versioning: if expiry deletes an object while versioning is on, does it become a billable prior version? If yes, "expire after 90 days" doesn't reduce the bill — exactly the surprise-bill risk the PRFAQ flags as #1. Deferred out of this scope, to be shipped later with that interaction answered explicitly.

### Why snapshot retention can't be per-bucket

A snapshot generation's entire value is being consistent *across* buckets, because the database references objects in all of them. If bucket A keeps snapshots 90 days and bucket B keeps 30, then on day 31 the older snapshots silently degrade into **partial** ones — restorable for A, gone for B — and you find out mid-incident.

So frequency and retention are project-level, single values. Per bucket you choose *participation*, which is the cost escape hatch. This makes the surface smaller, not bigger:

| Knob | Level | Why |
| --- | --- | --- |
| Snapshot frequency | **Project, fixed** | Only one correct value; see below |
| Snapshot retention | **Project** | Per-bucket retention makes older snapshots partial |
| Bucket participates | Bucket | Cost escape hatch; defaults to *in* |
| Version retention (days / max count) | Project default only (currently no override surface) | See "Versioning at bucket creation" below |
| ~~Current object expiry~~ | Deferred | Different product; see above |

### Frequency isn't a knob at all — it's fixed to "with every database backup"

Earlier drafts offered daily/hourly as "advanced options" for users who wanted more granularity. Design review (prompted by a colleague's question: *"should we just force Frequency to be per database backup?"*) concluded those options are a footgun, not a feature: with any cadence other than "with every database backup," the nearest snapshot to a given backup can be up to a full cadence interval older than it — you restore the database to time T, but Storage rolls back to some earlier time T-minus-up-to-a-day. That's the exact "rows referencing files that no longer exist" problem this feature exists to prevent, just reintroduced through a different door. There's no rounding logic that fixes this after the fact — the fix is to not offer the cadence that causes it. The Settings page now shows "With every database backup" as a static value, not a dropdown.

Versioning is the opposite case in one respect — undoing an overwrite in `avatars` has no relationship to `uploads`, and churn varies wildly, so per-bucket configuration is conceptually right — but see below for why the *editor* for it was cut back too.

### Versioning at bucket creation: default number, not a decision

The create/edit bucket modal originally exposed four versioning controls: enable/disable, an override switch, expiry days, and max noncurrent versions — on top of the one snapshot-participation switch. A colleague's review flagged this as the same footgun pattern as frequency: "could we just ship only the default versioning number + include in restore points? Or, if they must have the ability to change both, only allow after bucket creation?" A brand-new bucket is the worst possible moment to ask someone to reason about retention tradeoffs — they haven't seen how the bucket is actually used yet.

The modal now has exactly one control: **"Include in snapshots"**, defaulting to *in* (the participation default flipped from opt-in to opt-out to match the stated design intent above). Object versioning still exists and still applies — every bucket gets the project default (`PROJECT_VERSIONING_DEFAULTS`) — it's just not a decision the create/edit modal asks for. `avatars` in the mock data still has a versioning override, representing config set some other way (API, or a future dedicated surface), which the modal doesn't need to expose to stay honest about what's possible.

### Keeping two levels from being confusing

1. **Always show the effective value and its origin** — "Keeping 100 versions per file for 30 days (project default)" vs "(overridden for this bucket)". Never make users resolve inheritance in their heads.
2. **Lead with the promise, not the mechanism** — "You can roll Storage back to any of the last 90 days" instead of listing retention numbers. The policy is the implementation; the recovery window is what the customer is buying.
3. **"Snapshots" and "snapshot lifecycle", not "restore points".** Earlier drafts of this feature used "restore point" as an umbrella term — a single word for "the moment your whole environment can be rolled back to." In review that read as unclear: it's a made-up term competing with "backup," "snapshot," and "PITR recovery point," all of which already mean something specific to users. The prototype now says what it means: "snapshots" for the Storage-side artifact (matching the existing Snapshots tab and bucket-level "include in snapshots" toggle), and "snapshot lifecycle" for the project-level frequency/retention settings that govern them. The one place this term still earns its keep is the per-backup **coverage** concept (Database/Auth/Storage/Config) — that's about a backup's coverage, so it's described as such rather than reusing "restore point" as a noun.

### Where it's configured

| Surface | Role |
| --- | --- |
| Storage → Files → Settings | **Canonical editor** for the project-level snapshot lifecycle policy (fixed frequency, retention, include-new-buckets, per-bucket participation) |
| Bucket create/edit modal | This bucket's snapshot participation only; shows the inherited project policy read-only and links to Settings. Versioning applies at the project default and isn't edited here |
| Database → Backups banner | States actual coverage and links to Settings — one editor, so the two can't drift |

**One banner, state-aware.** The Backups page previously had a permanent "Storage objects are not included" alert. Once snapshots exist that statement is sometimes false, so it's a single notice with four states: feature off, capture off, partial coverage (warning + which buckets), full coverage. Never two banners describing the same thing.

## 8d. Where do Snapshots and Deleted files live?

Follow-up from review: *"I wonder if this UI should live within each bucket instead of at the file buckets root. I think that's where I'd expect to see it as a user ('I want to restore bucket static back to last week's version'), and it would remove the need for things like the bucket selector."*

The prototype now runs both placements side by side so we can compare, since there's no obvious right answer without touching it:

| Placement | URL | Bucket selector? | Best for |
| --- | --- | --- | --- |
| **Top-level, cross-bucket** | `/storage/files/snapshots`, `/storage/files/trash` | Yes — pick a bucket | "Snapshot / Deleted-files mental mode": handle recovery across buckets in one place, drop-down to switch |
| **In-bucket** | `/storage/files/buckets/<name>?view=snapshots`, `?view=trash` | No — locked to this bucket | "I want to restore *this* bucket to last week": recovery in the same context you already opened the bucket in |

**Implementation:** `Snapshots` and `Trash` both accept an optional `bucketId` prop. When passed, they hide their own bucket selector and skip the `?bucket=` query param. The in-bucket view is a `NavMenu` inside `pages/project/[ref]/storage/files/buckets/[bucketId].tsx` — Files / Snapshots / Deleted files — driven by a `?view=` `nuqs` state. The two surfaces are literally the same components, so there's no divergence risk while we compare them.

**Open question:** which placement to keep. The in-bucket view removes a selector click and matches how users describe the task ("restore this bucket to…"). The top-level view is better when the actual task is "clean up soft-deleted stuff across the project," which is genuinely a different mode. We may end up keeping both; if we cut one, the in-bucket view is likely the primary and the top-level tab becomes redundant navigation.

## 9. Open questions for the team

1. **Version chip noise** — showing `v3` on every versioned object could clutter dense buckets. Alternative: only show it in the pane + on hover. (Prototype shows both; recommend hover-only for the row, always-on in the pane.)
2. **"Size held" computation cost** — the honesty columns (size uniquely held by a snapshot / auto-remove date) require reference-counting across snapshots and lifecycle. Is this cheap enough to show live, or does it need a periodically-computed estimate with a "as of" timestamp?
3. **Trash grain** — per-bucket (proposed) vs a single project-wide trash. Per-bucket keeps RLS/policy scoping clear; project-wide is fewer clicks for cleanup.
4. **PITR ↔ snapshot** — is "nearest snapshot before timestamp" the right default, or should we refuse storage restore entirely for PITR to avoid implying second-level parity?
5. **Default expiries** — the prototype defaults versions to 30d and snapshots to 90d (matching the Press Release customer journey). Should new buckets default to *indefinite* (safer for recovery, worse for cost) or to these bounded defaults (better cost story, small data-loss risk)?
</content>
</invoke>
