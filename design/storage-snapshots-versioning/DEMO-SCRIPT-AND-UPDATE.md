# Storage Snapshots & Versioning — Demo Script, Project Update, and Scoping

Companion to [`README.md`](./README.md) (design spec) and [`IMPLEMENTATION.md`](./IMPLEMENTATION.md) (build notes). This doc is for presenting the prototype to Storage + Design for feedback, and scoping what's realistic in 4 weeks for Supabase Select.

---

## 1. Demo script (~15 min, live in Studio)

Setup: `pnpm dev:studio`, prototype flag on (`STORAGE_PROTECTION_ENABLED`), a project with a couple of buckets and a seeded backup history so the walkthrough doesn't depend on live data.

### Opening (1 min)

> "Quick recap: customers keep asking for two things — undo an accidental delete or overwrite on a single file, and recover a whole bucket to a known-good state. The scenario that comes up most on calls is a database restore leaving Storage out of sync — rows pointing at files that no longer exist, or files with no row referencing them. That's the PRFAQ's starting point.
>
> What I want to show today is a prototype of that — but reframed against the 3-year platform vision. Once you treat Storage as one of three primitives instead of a standalone product, a few of the design decisions change. I'll flag those as we go."

### Beat 1 — Enable protection (1–2 min)
**Storage → Files → a bucket → Edit bucket**
- Show the **Data protection** section: object versioning switch, and "include in snapshots" switch.
- Point out: versioning retention shows the project default inline ("Keeping N versions for D days") with an explicit override switch to diverge per bucket; lifecycle fields use the design system's "input with unit" pattern; the cost admonition appears inline at enable-time — not buried in docs.

### Beat 2 — Versioning in the explorer (2 min)
**Upload/overwrite a file → Preview pane → Versions tab**
- Version history lives where the file already lives — no separate page, no new navigation.
- Each version has three icon-only actions: download, restore, delete. The current version only gets download — it can't be restored onto itself or deleted while current, and visually it's no longer set apart, just a "Latest" badge on an otherwise plain row.
- Restore an older version; call out that it's **non-destructive** (promotes to a new current version, old current becomes noncurrent).
- Show a version **pinned by a snapshot** blocking delete — this is the direct answer to "when do I actually stop paying for this."

### Beat 3 — Deleted files (1–2 min)
**Storage → Files → Deleted files tab**
- Soft-deleted objects, an "auto-removes" column, one-click restore.
- Hover a row for a selection checkbox, shift-click for a range — same pattern as the main Explorer — then batch-restore or batch-delete from the selection bar. "Delete all permanently" clears a whole bucket in one action (deliberately not called "purge").
- Same "held by snapshot" state appears here too — one consistent mental model across both surfaces.

### Beat 4 — Snapshots (2 min)
**Storage → Files → Snapshots tab**
- Take a snapshot; show **Backup sync** (green) vs **Manual** trigger badges.
- Open Restore: the add / revert / remove diff shown **before** confirming — this is what makes a whole-bucket restore trustworthy instead of a leap of faith.

### Beat 5 — The platform reframe (3 min) — the part to slow down on
**Database → Backups → Scheduled**
- This is what changed after re-reading the vision docs.
- Each backup row now shows coverage chips: **Database / Auth / Storage / Config**.
- Explain: Auth users and Storage *metadata* live in Postgres, so a database restore brings them back for free. Object *bytes* don't — that asymmetry is exactly the drift bug in the PRFAQ.
- One state-aware coverage notice (not two overlapping banners anymore) names which buckets aren't covered, linking straight to the project's **Snapshot lifecycle** settings on the Storage Settings page — one place to fix it, not a separate dialog.
- Storage → Files → Settings → **Snapshot lifecycle**: frequency (with every backup / daily / hourly) and retention are project-level, since per-bucket retention would let a snapshot generation be complete for one bucket and expired for another on the same day. Bucket-level keeps only participation (opt-out) and versioning's own override.
- Open Restore: it defaults to **"into a new preview branch,"** not in-place. Tie this explicitly to "branching is a platform primitive, not a database feature" — a CoW branch is cheap and reversible, so verify-then-promote should be the default; destructive in-place restore becomes the deliberate exception.

### Beat 6 — Usage/billing honesty (1–2 min)
**Organization → Usage → Storage Size**
- Folded into the *existing* Storage Size section — no new card, same stacked-chart idiom as Egress.
- Live / versions / snapshots breakdown + per-bucket table — answers "why did my bill grow" without a support ticket.

### Close (1–2 min)
- Mention the CLI sketch in the design doc — `--dry-run` on snapshot restore mirrors the same diff shown in the dashboard, so the two surfaces agree.
- Vision tie-in: three primitives, Postgres as source of truth, branching as the default recovery path. Nothing here required a fourth primitive.
- **Ask the room:**
  - Storage: does branch-first restore hold up against how storage branching is actually sequenced (2026–2027 per the vision)?
  - Storage: per-bucket Deleted files, or project-wide?
  - Design: does the platform reframe (coverage chips, "snapshot lifecycle" language) read as coherent, or is it doing too much in one screen?

---

## 2. Project update (for you to send/present)

> **First design pass and thoughts on Storage Snapshots and Object Versioning**
>
> I approached this design exploration by working backwards from an end state that maximizes value across the whole product experience — from a platform-wide point of view, not a Storage-only one — starting from these fundamentals:
>
> 1. Users are asking to
>    1. undo an accidental delete or overwrite on a single file
>    2. recover a whole bucket to a known-good state without Storage falling out of sync with the database
> 2. The 3-year Product Vision, particularly two principles that ended up shaping the design directly: "three primitives, not thirty products," and branching as a first-class primitive
>
> Full demo in the attached video. Here are some highlights:
>
> **1. Backups restore the entire project state, not just the database**
> Each backup row shows per-primitive coverage — Database, Auth, Storage, Config — so it's clear at a glance what actually comes back when you restore, not just that a backup exists. Auth is called out explicitly because it's easy to assume it's separate, when in fact users and sessions live in Postgres and restore for free with the database — Storage is the one that doesn't come along automatically, which is exactly the gap in the original ask. The coverage notice on the Backups page now also collapses to a single state-aware banner (previously two overlapping ones) and links straight to one settings page to fix a gap, rather than opening its own one-off editor.
>
> One small consequence: I renamed the page from "Database Backups" to "Backups." Open question below on whether it eventually belongs somewhere else entirely.
>
> **2. Restore a backup into a new preview branch, or over production**
> Given branching is meant to be a first-class, cheap, copy-on-write primitive, defaulting to "restore into a preview branch" felt like the right call: verify the restored state is actually what you expect, then promote to production — instead of committing to a destructive restore blind. In-place restore over production stays available as the deliberate escape hatch, not the default.
>
> **3. Recover deleted files**
> A dedicated view — mentally modeled on a Trash/Recycle Bin, though I landed on calling it "Deleted files" in the actual UI since it reads a bit less informal — lists every soft-deleted object, filtered by bucket. Selection now works the same way as the main file browser: hover a row for a checkbox, shift-click for a range, and a bulk action bar appears for the batch. From there you can:
>
> - restore a file (or a batch of files)
> - delete a file (or a batch) permanently
> - delete every deleted file in a bucket permanently, in one action
>
> I considered "purge" for that last one and moved away from it: it's jargon, it doesn't actually say what happens, and it would've been a third word for an action already called "delete permanently" everywhere else in this flow. Landed on **"Delete all permanently"** instead, so the vocabulary stays consistent end to end.
>
> **4. Object versions, surfaced where the file already lives**
> No new navigation for this one — the file preview panel gets a Versions tab listing every version of an object. Each version now has three explicit, single-icon actions — download, restore, delete — instead of one ambiguous button, so it's clear what's possible without guessing. The current version only ever gets download, since it can't be restored onto itself or deleted while it's current; visually it's no longer set apart in its own bordered card either — it sits in the same plain timeline as every other version, distinguished only by a "Latest" badge, since the extra styling wasn't earning its keep.
>
> Restoring is non-destructive: it promotes an older version to become the new current version, and the previous current version just becomes another entry in the list. Deleting a version respects the same lock as before — a version held by a bucket snapshot can't be permanently deleted until that snapshot is removed. This is meant to be the direct, in-context answer to the question that matters most for trust here: "when do I actually stop paying for this?"
>
> **5. Bucket snapshots, with a restore diff instead of a leap of faith**
> A new Snapshots view per bucket — living as a tab under Files rather than a new item in the left nav, since it's a recovery lens on file buckets, not a new bucket type alongside Analytics/Vectors. Each snapshot shows whether it was taken automatically (right before a scheduled backup — now badged as "Backup sync" in green, rather than an unstyled "Pre-backup" label) or manually. Restoring one shows the exact diff before you confirm — objects added back, objects reverted, objects that will be removed — so restoring an entire bucket doesn't require blind trust.
>
> **6. Storage cost has to stay legible, or this becomes a support-ticket generator**
> The existing Storage Size usage chart now splits into live objects / object versions / snapshots, folded into the section that's already there rather than bolted on as a new card, so it's consistent with how every other usage metric on that page is presented. A per-bucket table shows exactly which bucket's retention is driving the number. This was arguably the single highest-risk item in the original PRFAQ's own internal review: if a customer can't answer "when is my object truly gone, and when do I stop paying for it?" without reading docs, the feature generates billing-surprise tickets instead of trust.
>
> **7. Keeping Storage in sync with backups without silent drift**
> This one changed the most since I first sketched it. A single per-bucket toggle has a trap: it quietly stops covering a bucket created after the fact, so a fully-recoverable project degrades without anyone noticing — and if retention were also set per bucket, a snapshot generation could be complete for one bucket and already expired for another on the very same day, silently. So the two settings that determine *whether a usable snapshot exists at all* — how often Storage is captured (with every database backup, daily, or hourly) and how long it's retained — now live in one place: a project-level "Snapshot lifecycle" settings section, plus an "include new buckets automatically" switch so newly created buckets aren't a silent gap.
>
> (Renamed from my earlier "restore points" language, which read as an invented umbrella term competing with "backup," "snapshot," and "PITR recovery point." Settling on "snapshots" ties it back to the Snapshots tab and the bucket-level "include in snapshots" toggle users already see.)
>
> Bucket-level configuration keeps only what's genuinely bucket-specific: whether a bucket participates at all (the deliberate opt-out, e.g. for a large regenerable cache bucket), and object-versioning's own retention, which can inherit the project default or be overridden per bucket — since keeping more or fewer old versions of one noisy bucket doesn't put other buckets' snapshots out of sync. The old idea of a separate "sync" dialog is gone too: the coverage notice on the Backups page now links straight to this one settings page, so there's exactly one place this is configured, not two that can drift apart from each other.
>
> ---
>
> **Open questions I'd love feedback on:**
> - Does branch-first restore hold up against how storage-level branching actually gets sequenced, or is it getting ahead of the infrastructure?
> - Per-bucket "Deleted files," or one project-wide view?
> - Do the coverage chips (Database / Auth / Storage / Config) communicate the right amount on one row, or is it trying to say too much at a glance?
> - Now that a backup's coverage spans more than the database, does "Backups" still belong under Database, or does it eventually move — into a project-wide "Recovery" area, or even next to Branches once storage branching lands?
> - Is project-level frequency + retention, plus a bucket-level participation/versioning-override split, the right amount of configuration surface — or does even two levels read as one too many for most people?
>
> *("Deleted files" vs "Trash" is no longer an open question — landed on "Deleted files" and it's shipped consistently across the UI.)*

---

## 3. Four-week scope (for Supabase Select)

The honest framing: Select is a demo moment, and the original PRFAQ already named the genuinely hard problems as infra-level and unsolved. Four weeks buys a polished demo, not a shipped feature.

### Ships in 4 weeks

| Item | Notes |
| --- | --- |
| Polished version of everything already prototyped | Full copy pass, loading/error/empty states, a11y check, responsive check. Still mock-data-backed. |
| A seeded demo project | Scripted data so the live walkthrough doesn't depend on real backend state — reliable on stage. |
| Demo materials | This script + a one-pager for conference use, plus the design doc for anyone who wants the deeper spec. |
| *(Stretch, needs a leadership call)* One real, narrow vertical slice | E.g. actual `version_id` + soft-delete metadata in the storage schema for a private-alpha project — no lifecycle expiry, no snapshot-driven hard-delete blocking, no billing integration. Real but deliberately narrow. |

### Needs more time (post-Select)

| Item | Why it can't compress |
| --- | --- |
| Event-driven lifecycle expiry | Flagged as unsolved in the original Internal FAQ — new infra that has to scale without polling, not a sprint task. |
| Hard-delete coordination (Postgres ↔ S3) | Correctness-critical distributed-systems problem: a version/snapshot expiring must never leave DB metadata out of sync with S3, in either direction. |
| Whole-bucket restore diff/apply at scale | Computing and applying add/revert/remove sets against potentially millions of objects is a different problem than rendering the diff UI. |
| Storage snapshot scheduler ↔ DB backup scheduler integration | Today these are separate services; wiring "snapshot before every scheduled backup" for real is cross-team orchestration work. |
| Per-bucket/version/snapshot usage attribution in billing | Today Storage Size is one number end-to-end in the pipeline; true attribution is a data-engineering project, not a UI change. |
| Storage-level branching for restore-to-branch | Branchable storage is itself a 2026–2027 primitive per the vision — this feature shouldn't get ahead of it; it should ride on it once it lands. |

The throughline for both columns: everything in the "4 weeks" list is what a dashboard can show *today*; everything in "needs more time" is what makes the dashboard's promises *true* in production.
