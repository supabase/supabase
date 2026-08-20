# PR split marker — replication stepped create wizard

Living notes for splitting `dnywh/feat/studio-replication-stepped-create` into reviewable PRs.
Update this file as the branch evolves.

**Draft PR:** https://github.com/supabase/supabase/pull/49243

**Route:** `/project/<ref>/database/replication/new`

**Wizard pattern guide:** [`STEPPED_FLOW.marker.md`](../../../ui/SteppedFlow/STEPPED_FLOW.marker.md) — navigation rules, foot guns, review-step patterns. Read before changing the wizard or building another stepped flow.

---

## How to use this file

Each slice lists files, rationale, and a suggested commit/PR title. When splitting:

1. Cherry-pick or branch from base in dependency order (foundational slices first).
2. Copy the rationale block into the PR description for that slice.
3. Mark slices `[x]` here once merged.

---

## Slice 1 — SteppedFlow layout primitive `[ ]`

**Suggested title:** `feat(studio): add stepped flow layout for multi-step forms`

**Rationale:** Extract a reusable single-column stepped layout (step counter, card body, footer nav) from the pipeline wizard. Other flows can adopt it without pulling in replication logic.

**Files:**

- `apps/studio/components/ui/SteppedFlow/SteppedFlow.tsx`
- `apps/studio/components/ui/SteppedFlow/SteppedFlow.test.tsx`

**Behaviour:**

- Removed sidebar stepper; single card column (~760px).
- Header slot via `SteppedFlowHeader` (title, description, optional `actions`).
- Footer: Back (hidden on step 1), Continue / final action.
- Quiet step label: `Step X of Y · Label` above the card.
- `navigationDisabled` disables Back during async work.

**Tests:** Back visibility, final action on last step, disabled Back while locked.

---

## Slice 2 — Disabled button cursor (design system) `[ ]`

**Suggested title:** `fix(ui): show not-allowed cursor on disabled buttons`

**Rationale:** Disabled buttons set `cursor-not-allowed` but also `pointer-events-none`, so the cursor fell through to elements underneath and never showed not-allowed. Clicks are already blocked by the native `disabled` attribute and the Button `onClick` guard.

**Files:**

- `packages/ui/src/components/Button/Button.tsx`

**Change:** Remove `pointer-events-none` from the disabled variant; keep `opacity-50 cursor-not-allowed`.

**Surfaces affected:** Wizard Back/Edit while saving or validating, and any other disabled `Button` in Studio.

---

## Slice 3 — Destination type selection cleanup `[ ]`

**Suggested title:** `refactor(studio): simplify replication destination type selection`

**Rationale:** Prepare `DestinationTypeSelection` for the wizard radio step; remove footer copy that moved elsewhere.

**Files:**

- `apps/studio/components/interfaces/Database/Replication/DestinationPanel/DestinationTypeSelection.tsx`
- `apps/studio/components/interfaces/Database/Replication/DestinationPanel/DestinationTypeSelection.test.tsx`

**Behaviour:**

- Removed per-card footer: "Cannot be changed after creation" and "Leave feedback".
- Immutability copy moved to wizard destination step header and review Type field description.

---

## Slice 4 — List page feedback + constants `[ ]`

**Suggested title:** `feat(studio): add leave feedback on replication list`

**Rationale:** Feedback belongs on the list page next to Docs, not on every destination card.

**Files:**

- `apps/studio/components/interfaces/Database/Replication/Destinations.tsx`
- `apps/studio/components/interfaces/Database/Replication/Replication.constants.ts`

**Behaviour:**

- `PIPELINES_FEEDBACK_URL` constant.
- "Leave feedback" button top-right on the replication list.

---

## Slice 5 — Destination form polish (shared with sheet) `[ ]`

**Suggested title:** `fix(studio): replication destination form UX polish`

**Rationale:** Small fixes that benefit both the add/edit sheet and the wizard; safe to land independently.

**Files:**

- `apps/studio/components/interfaces/Database/Replication/DestinationPanel/DestinationForm/DestinationNameInput.tsx` — 1Password ignore attrs (`data-1p-ignore`, etc.).
- `apps/studio/components/interfaces/Database/Replication/DestinationPanel/DestinationForm/BigQuery/BigQuery.utils.ts` — JSON parse validation for service account key.
- `apps/studio/components/interfaces/Database/Replication/DestinationPanel/DestinationForm/DestinationForm.utils.test.ts` — tests for JSON validation.
- `apps/studio/components/interfaces/Database/Replication/DestinationPanel/DestinationForm/AdvancedSettings.tsx` — layout/group refactor for connection vs data steps.
- `apps/studio/components/interfaces/Database/Replication/DestinationPanel/DestinationForm/ValidationFailuresSection.tsx` — still used by sheet; wizard review uses section admonitions instead.
- `apps/studio/components/interfaces/Database/Replication/CreatePipeline/PipelineRegionField.tsx` — shared region field tweaks.

**Behaviour:**

- Service account key: required when set; must parse as JSON (`Service account key must be valid JSON`).
- Name field ignored by password managers.

---

## Slice 6 — Create pipeline wizard core `[ ]`

**Suggested title:** `feat(studio): stepped create pipeline wizard`

**Rationale:** Main feature — full-page stepped flow replacing sheet-only create for `/replication/new`.

**Files:**

- `apps/studio/components/interfaces/Database/Replication/CreatePipeline/CreatePipelineWizard.tsx`
- `apps/studio/components/interfaces/Database/Replication/CreatePipeline/CreatePipelineWizard.utils.ts`
- `apps/studio/components/interfaces/Database/Replication/CreatePipeline/CreatePipelineWizard.utils.test.ts`
- `apps/studio/components/interfaces/Database/Replication/CreatePipeline/PipelineCreateStepDescription.tsx`
- `apps/studio/components/interfaces/Database/Replication/CreatePipeline/PipelineCreateStepDescription.test.tsx`

**Behaviour:**

- Steps: Destination → Connection → Data → Review.
- **Validation on Continue only** (default RHF `onSubmit` mode); `form.trigger()` per step on Continue press. No inline errors while typing until Continue is pressed.
- Continue only disabled on Destination when no type selected; Connection/Data always clickable to surface errors.
- Step copy on `PIPELINE_CREATE_STEPS`; `PipelineCreateStepDescription` renders plain text (no inline doc links).
- **Docs button** in header on Connection and Data only (not Destination or Review). URL varies by step via `getPipelineCreateStepDocsUrl`:
  - Connection → destination setup docs (BigQuery-specific or generic configure-a-destination).
  - Data → publication docs.
- `navigationDisabled` while saving/validating.
- Destination step header includes immutability: "Cannot be changed after creation."
- **Destination type change:** Back to destination allows changing type. Switching type resets destination-specific credentials while keeping name, publication, and table sync choices (`mergeFormValuesForDestinationTypeChange`).

---

## Slice 7 — Review step UI `[ ]`

**Suggested title:** `feat(studio): review summary for create pipeline wizard`

**Rationale:** Read-only review with section-level edit affordances and inline validation; no redundant footer error block.

**Files:**

- `apps/studio/components/interfaces/Database/Replication/CreatePipeline/PipelineReviewSummary.tsx`
- `apps/studio/components/interfaces/Database/Replication/CreatePipeline/PipelineReviewSummary.test.tsx`
- `apps/studio/components/interfaces/Database/Replication/CreatePipeline/PipelineValidationAdmonition.tsx`

**Behaviour:**

- Read-only `Input` fields with labels matching earlier steps (e.g. "Project ID", "Name").
- One **Edit** button per section (Connection, Data) only. Destination type is read-only on review (no Edit).
- Removed Source section (always this project).
- Destination type immutability as field description under Type.
- Validation failures inline under Connection and Data sections only; removed bottom "Configuration issues" summary admonition.
- `PipelineValidationAdmonition`: sandwiched in card (`border-x-0 border-t-0 border-b border-default`, `layout="responsive"`). Section header Edit only; no Edit on the admonition.
- Scroll-to-first-failure on submit via `validationScrollRef` on first affected section admonition.
- Read-only inputs selectable/copyable (no blur-on-focus hack).
- `editDisabled` while saving/validating.

**Tests:** Edit navigation, no source section, immutability copy, disabled edit, connection failures in section.

---

## Dependency order (recommended split sequence)

1. Slice 2 — Button cursor (optional early; tiny, independent)
2. Slice 1 — SteppedFlow
3. Slice 3 — DestinationTypeSelection
4. Slice 4 — List feedback
5. Slice 5 — Form polish
6. Slice 6 — Wizard core (depends on 1, 3, 5)
7. Slice 7 — Review UI (depends on 6)

---

## Changelog (session log)

| Date       | Change                                                                                 |
| ---------- | -------------------------------------------------------------------------------------- |
| 2026-08-20 | SteppedFlow: single column, step counter, Back/Continue footer                         |
| 2026-08-20 | Review: read-only inputs, section Edit, sandwiched validation admonitions              |
| 2026-08-20 | Removed review footer validation admonition; failures only in sections                 |
| 2026-08-20 | Sandwiched admonition: `border-t-0`, `layout="responsive"`                             |
| 2026-08-20 | Docs: header button on connection/data with step-specific URL; plain step descriptions |
| 2026-08-20 | BigQuery service account key JSON validation                                           |
| 2026-08-20 | Validation on Continue only (not onChange)                                             |
| 2026-08-20 | Button disabled: drop `pointer-events-none` for not-allowed cursor                     |
| 2026-08-20 | Removed return-to-review footer shortcut from SteppedFlow                              |
| 2026-08-20 | Destination type change resets credentials; Back allows type change again              |
|            | _Add future rows here_                                                                 |

---

## Out of scope / not in this branch

- Committing or opening new PRs (unless explicitly requested).
- Destination add/edit sheet validation mode (`DestinationForm/index.tsx` still `onChange` — consider aligning in a follow-up).
- Mapping API `validation_failures` to RHF field paths (API has `failure_type`, `name`, `reason` only; no field path).
