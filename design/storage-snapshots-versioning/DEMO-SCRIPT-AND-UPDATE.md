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
- Show the new **Data protection** section: Object versioning + Bucket snapshots toggles.
- Point out: per-bucket opt-in, lifecycle fields use the design system's "input with unit" pattern, and the cost admonition appears inline at enable-time — not buried in docs.

### Beat 2 — Versioning in the explorer (2 min)
**Upload/overwrite a file → Preview pane → Versions tab**
- Version history lives where the file already lives — no separate page, no new navigation.
- Restore an older version; call out that it's **non-destructive** (promotes to a new current version, old current becomes noncurrent).
- Show a version **pinned by a snapshot** blocking hard-delete — this is the direct answer to "when do I actually stop paying for this."

### Beat 3 — Trash (1–2 min)
**Storage → Files → Trash tab**
- Soft-deleted objects, an "auto-removes" column, one-click restore.
- Same "held by snapshot" state appears here too — one consistent mental model across both surfaces.

### Beat 4 — Snapshots (2 min)
**Storage → Files → Snapshots tab**
- Take a snapshot; show Pre-backup vs Manual trigger badges.
- Open Restore: the add / revert / remove diff shown **before** confirming — this is what makes a whole-bucket restore trustworthy instead of a leap of faith.

### Beat 5 — The platform reframe (3 min) — the part to slow down on
**Database → Backups → Scheduled**
- This is what changed after re-reading the vision docs.
- Each backup row now shows coverage chips: **Database / Storage / Config**.
- Explain: Auth users and Storage *metadata* live in Postgres, so a database restore brings them back for free. Object *bytes* don't — that asymmetry is exactly the drift bug in the PRFAQ.
- The coverage notice names which buckets aren't protected, with a link to fix it.
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
  - Storage: per-bucket Trash, or project-wide?
  - Design: does the platform reframe (coverage chips, "restore point" language) read as coherent, or is it doing too much in one screen?

---

## 2. Project update (for you to send/present)

> **Subject: Storage recovery (Snapshots & Versioning) — prototype + a platform reframe, feedback wanted**
>
> Hey team,
>
> Sharing where I've landed on the Storage Snapshots & Versioning work. Scope moved a bit from the original PRFAQ — in a direction I think is more durable — and I want your read on it before going further.
>
> **Where it started.** The PRFAQ was scoped to Storage: object versioning for single-file recovery, bucket snapshots for whole-bucket recovery, and snapshots timed to database backups so both land on the same point in time. That's still the core of what's prototyped.
>
> **Why I widened the frame.** Re-reading the 3-year product and engineering vision, two principles didn't sit well with a Storage-only design:
> - *"Three primitives, not thirty products"* — designing this as a Storage feature risks it becoming a fourth thing bolted alongside Database / Storage / Compute, instead of a composition of what already exists.
> - *"Branching is a first-class primitive"* — the vision is explicit that branching lives at the block/CoW layer, and everything that persists state in Postgres inherits it for free. A recovery feature that doesn't default to "restore into a branch" is fighting that architecture, not building toward it.
>
> So the prototype now treats a database backup as a restore point for the **environment** — Database, Storage, and Config — rather than a database artifact with a Storage bolt-on. Concretely: each backup shows coverage across all three; restoring defaults to a new preview branch (cheap, reversible, verify-then-promote), with in-place restore as an explicit, warned-against escape hatch; and the coverage gap — buckets without snapshots — is named instead of silently reproducing the drift the PRFAQ set out to fix.
>
> **What's built.** Real Studio components, not a static mockup, behind a prototype flag and wired to mock data since there's no backend yet: per-bucket enable with lifecycle policies, version history in the file preview pane with non-destructive restore, a Trash view, a Snapshots view with restore-with-diff, Database/Storage/Config coverage on backup rows with branch-first restore, and Storage Size in Org Usage broken into live/versions/snapshots inside the existing section.
>
> **What's deliberately unsolved.** The PRFAQ's own Internal FAQ was honest that the hard part is infra, not UI: event-driven lifecycle expiry, hard-delete coordination between Postgres and S3, and bucket-restore diffing at scale. None of that is in this prototype — it's all mocked. I don't think that's a gap in the demo; I think it's the right place to draw the line before a design review.
>
> **What I'd like from you:**
> - **Storage** — does branch-first restore hold up against how storage branching is actually sequenced? Per-bucket Trash, or project-wide?
> - **Design** — does the platform reframe read as coherent, or is it trying to do too much in one screen?
>
> I'll walk through it live, ~15 minutes.

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
