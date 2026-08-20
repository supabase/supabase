# Stepped flow wizard pattern

Living notes for building multi-step create wizards in Studio using `SteppedFlow`.
Read this before adding shortcuts, review-step edits, or cross-step navigation to a new wizard.

**Reference implementation:** create pipeline wizard  
`apps/studio/components/interfaces/Database/Replication/CreatePipeline/CreatePipelineWizard.tsx`  
Route: `/project/<ref>/database/replication/new`

**Layout primitive:** `SteppedFlow.tsx` in this directory

---

## When to use

| Surface             | Prefer when                                | Example in Studio                       |
| ------------------- | ------------------------------------------ | --------------------------------------- |
| **Full-page route** | 3+ steps, dense controls, user needs focus | Create pipeline (`/replication/new`)    |
| **Sheet**           | 2–3 lighter steps, stay in context         | Scoped access token create              |
| **Modal / dialog**  | Confirm branches on top of a picker        | Plan change (side panel + dialog today) |

`SteppedFlow` provides footer, step counter, and card body only. Wrap it in a page, sheet, or dialog; keep step state, validation, and submit in the consumer.

Sheets work for short flows. After **3+ steps** or heavy controls per step, prefer a full-page route.

---

## How to use this file

1. Read **Navigation rules** and **Foot guns** before changing an existing wizard or shipping a new one.
2. Append a changelog row when behaviour or guidance changes.

---

## Architecture

Split responsibilities deliberately:

| Layer            | Owns                                                        | Example                         |
| ---------------- | ----------------------------------------------------------- | ------------------------------- |
| `SteppedFlow`    | Layout only: step counter, card, Back / Next / final action | No form state, no validation    |
| Wizard component | Step state, RHF form, per-step validation, submit           | `CreatePipelineWizard`          |
| Step utils       | Step metadata, field lists, merge helpers                   | `CreatePipelineWizard.utils.ts` |
| Review UI        | Read-only summary, section Edit affordances                 | `PipelineReviewSummary`         |

`SteppedFlow` should stay dumb. Putting furthest-step tracking, validity gating, or skip logic in the layout primitive couples every future consumer to one wizard's edge cases.

---

## Navigation rules (intentional constraints)

### Linear forward progress only

- **Back** goes to the previous step.
- **Next** runs that step's validation, then advances one step.
- **Final action** (e.g. Create) only on the last step.

There is **no skip-to-step shortcut** in the footer. We tried a return-to-review button and removed it (see below).

To return to review after editing connection or data: use **Edit** on the review step, fix the step, then **Next** forward through each intermediate step again.

### Do not add

- Footer "jump to step X" buttons (Review, Summary, etc.)
- Clickable sidebar / header stepper that jumps ahead of validated progress
- `furthestIndex` + conditional shortcuts without strict per-step re-validation

If a shortcut feels necessary, prefer **Edit** on the review step that sends the user to a specific earlier step and forces linear return — not a parallel jump path.

---

## Foot guns we hit (learn from these)

### 1. Return-to-review shortcut

**What we tried:** After visiting Review once, show a **Review** button in the footer on earlier steps so users could jump back without clicking Continue through Data.

**What broke:** User could Edit connection, go Back to destination, change BigQuery → DuckLake, then hit **Review** and land on review with stale BigQuery form values and a mismatched destination type.

**Fix attempted:** Gate the shortcut on `hasValidConnection` + `hasValidDataStep`, lock destination type after leaving destination step, merge form values on type change.

**Final fix:** **Remove the shortcut entirely.** The compensating logic was more complex and fragile than the UX win.

**Lesson:** Shortcuts that bypass step validation create combinatorial state. Default to linear navigation; only add shortcuts if you can re-run full validation atomically on jump (usually not worth it).

### 2. Edit destination from review (resolved)

**Early concern:** Edit on Destination from review could let users change type and skip re-validating connection/data.

**Current approach:** Edit destination is restored for discoverability. With linear navigation only (no footer shortcuts) and `mergeFormValuesForDestinationTypeChange` on type change, users must walk forward again through connection and data after changing type.

**Lesson:** Edit-from-review is fine when there is no skip path and dependent form state resets on branch change.

### 3. Locking destination type on Back

**What we tried:** Lock destination type radios after first Continue so type could not change mid-flow.

**What broke:** UX felt punitive — wrong type on step 1, Back, everything disabled with no explanation.

**Fix:** Always allow type change on the destination step. On type change, call `mergeFormValuesForDestinationTypeChange` to reset destination-specific credentials while keeping shared pipeline fields (name, publication, table sync, advanced settings).

**Lesson:** Prefer **state reset on change** over **UI lock** when the user might legitimately need to go Back and fix an earlier choice.

### 4. Validation mode `onChange`

**What we tried:** Show inline errors while typing.

**What broke:** Noisy on long forms; users see errors before they finish a field.

**Fix:** Default RHF `onSubmit` mode. **`form.trigger()` only on Next** for the current step's field list. Next stays enabled on connection/data so pressing it surfaces errors.

**Lesson:** Stepped wizards validate **per step on Next**, not continuously.

### 5. API `validation_failures` → form fields

**Shape:** `{ failure_type, name, reason }` — **no field path**.

**Impact:** Cannot reliably map server failures to RHF field errors without brittle name→field heuristics.

**Current approach:** Section-level admonitions on review (Connection, Data). Scroll to first failure on submit. Field-level mapping deferred until API exposes paths.

**Lesson:** Plan review UX for **section-level** server errors, not inline field errors, unless the API contract supports paths.

---

## Review step pattern

### Do

- Read-only inputs (selectable/copyable text).
- One **Edit** button per section (Destination, Connection, Data), jumping to that step.
- Inline validation admonitions **under the relevant section**, not a duplicate summary at the bottom.
- `editDisabled` while saving or validating.
- Section header Edit only; do not duplicate Edit on the admonition.

### Do not

- Source section when it is always implicit (e.g. current project).
- Blur-on-focus hacks on read-only inputs.

### Returning from Edit

User path: Review → Edit connection → fix → Next → Data → Next → Review.  
No footer shortcut. SteppedFlow does not track "furthest step".

---

## Branching and dependent form state

When an early step changes **which fields exist** on later steps (destination type, provider, region):

1. Keep a shared-field allowlist (name, publication, sync options, etc.).
2. On branch change, reset branch-specific fields to defaults via a merge helper.
3. Clear API validation state (`resetValidation()`).
4. Do not assume hidden RHF values are harmless — reset explicitly.

Reference: `mergeFormValuesForDestinationTypeChange` in `CreatePipelineWizard.utils.ts`.

---

## Create vs edit

| Mode       | Surface                                       | Notes                               |
| ---------- | --------------------------------------------- | ----------------------------------- |
| **Create** | Full-page stepped wizard                      | `/replication/new`                  |
| **Edit**   | Existing sheet (`DestinationPanel`, `?edit=`) | Do not reuse the full create wizard |

Edit keeps destination type locked via `?edit=` query (existing behaviour). Create allows type change on the destination step until the pipeline exists.

---

## SteppedFlow API (current)

```tsx
<SteppedFlow
  steps={[{ id, label }, ...]}
  currentStep={stepId}
  onStepChange={setStep}
  onNext={handleNext}           // wizard runs validation here
  nextDisabled={...}            // e.g. no destination selected
  navigationDisabled={...}    // disable Back during async work
  finalAction={{ label, onClick, loading, disabled, form, type }}
>
  <SteppedFlowHeader title description actions />
  {/* step body */}
</SteppedFlow>
```

**Props intentionally absent:** `canReturnToLast`, skip buttons, sidebar stepper.

---

## Checklist for new wizards

Before shipping:

- [ ] Forward navigation only via Next (validated per step)
- [ ] No footer jump shortcuts without a written threat model
- [ ] Review Edit sends user to the step; linear return required
- [ ] Early branching changes reset dependent form state
- [ ] Validation on Next, not onChange (unless strong reason)
- [ ] Server errors mapped to section admonitions unless API gives field paths
- [ ] `navigationDisabled` during submit/validate
- [ ] Create and edit flows explicitly decided (same wizard or not?)
- [ ] Tests cover Back, Next gating, review Edit navigation, disabled state while saving

---

## Migration candidates

Flows in Studio that could adopt `SteppedFlow`. Only **Create pipeline** uses it today.

Use this list when picking the next migration or when a flow starts growing its own step/footer logic. Paths are relative to `apps/studio/`.

### Priority order (suggested)

| Priority | Flow                          | Why first                                                      |
| -------- | ----------------------------- | -------------------------------------------------------------- |
| 1        | New scoped access token       | Smallest; already form → review with Back/Next                 |
| 2        | Storage policy editor modal   | Branching views + review-before-save, same lessons as pipeline |
| 3        | Claim project                 | Clean linear 3-step page flow                                  |
| 4        | Subscription plan change      | Side panel + dialog unification                                |
| 5        | Plan downgrade / cancellation | Many steps, modal chain today                                  |
| 6        | Postgres upgrade              | Blocking state during upgrade                                  |
| 7        | Restore backup to new project | Dialog chain maps cleanly to steps                             |

---

### Already migrated

| Flow                            | Files                                                                                                                                                                                                        | Notes                                                               |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| **Create replication pipeline** | `components/interfaces/Database/Replication/CreatePipeline/CreatePipelineWizard.tsx`<br>`CreatePipelineWizard.utils.ts`<br>`PipelineReviewSummary.tsx`<br>`pages/project/[ref]/database/replication/new.tsx` | Reference implementation. Destination → Connection → Data → Review. |

---

### Strong fit (Back/Next or form → review)

| Flow                                 | Files                                                                                                                                                                                             | Surface      | Fit                                                            | Complexity |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | -------------------------------------------------------------- | ---------- |
| **New scoped access token**          | `components/interfaces/Account/AccessTokens/Scoped/Form/NewScopedTokenForm.tsx`<br>`NewScopedTokenSheet.tsx`<br>`StepIndicator.tsx`<br>`NewScopedTokenFormReview.tsx`<br>`ResourceAccessStep.tsx` | Sheet        | Custom 2-step indicator + review; closest match after pipeline | Med        |
| **Storage policy create/edit**       | `components/interfaces/Storage/StoragePolicies/PolicyEditorModal/index.tsx`<br>`PolicySelection.tsx`<br>`PolicyEditor.tsx`<br>`PolicyReview.tsx`<br>`PolicyTemplates.tsx`                         | Modal        | 4 views (selection → templates → editor → review) with Back    | High       |
| **Storage policies bulk edit**       | `components/interfaces/Storage/StoragePolicies/StoragePoliciesEditPolicyModal.tsx`<br>`StoragePoliciesReview.tsx`                                                                                 | Modal        | Same multi-view pattern as above                               | High       |
| **Claim project**                    | `pages/claim-project.tsx`<br>`components/interfaces/Organization/ProjectClaim/choose-org.tsx`<br>`benefits.tsx`<br>`confirm.tsx`                                                                  | Full page    | 3-step linear wizard (choose org → benefits → confirm)         | Med        |
| **Forgot password**                  | `components/interfaces/SignIn/ForgotPasswordWizard.tsx`<br>`pages/forgot-password.tsx`                                                                                                            | Full page    | 2-step (email → OTP); uses legacy `WizardLayout`               | Low–Med    |
| **Restore backup to new project**    | `components/interfaces/Database/RestoreToNewProject/RestoreToNewProject.tsx`<br>`ConfirmRestoreDialog.tsx`<br>`CreateNewProjectDialog.tsx`                                                        | Dialog chain | Pick backup → confirm → create; explicit Continue today        | Med        |
| **Disk config review before submit** | `components/interfaces/DiskManagement/DiskManagementReviewAndSubmitDialog/DiskManagementReviewAndSubmitDialog.tsx`                                                                                | Dialog       | Form + separate review dialog                                  | Med        |

---

### Subscription and billing

| Flow                              | Files                                                                                                                                                                                                                                                                                                                                    | Surface             | Fit                                                                                                                                               | Complexity |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| **Subscription plan change**      | `components/interfaces/Organization/BillingSettings/Subscription/PlanUpdateSidePanel.tsx`<br>`SubscriptionPlanUpdateDialog.tsx`<br>`PaymentMethodSelection.tsx`<br>`Subscription.tsx` (entry)<br>`state/organization-settings.ts` (`panelKey: 'subscriptionPlan'`)<br>`components/interfaces/Billing/Subscription/Subscription.utils.ts` | Side panel + dialog | Pick tier in side panel → confirm/proration/payment in dialog. Not linear today; good candidate to unify into select → review → payment → confirm | High       |
| **Plan downgrade / cancellation** | `components/interfaces/Organization/BillingSettings/Subscription/CancellationFlow.tsx`<br>`DowngradeModal.tsx`<br>`ExitSurveyModal.tsx`<br>`MembersExceedLimitModal.tsx`                                                                                                                                                                 | Modal chain         | State machine across modals; could become stepped downgrade flow                                                                                  | Med–High   |
| **Post-upgrade survey**           | `components/interfaces/Organization/BillingSettings/Subscription/UpgradeModal.tsx`                                                                                                                                                                                                                                                       | Modal               | Follow-on after successful upgrade from plan change                                                                                               | Low        |
| **Spend cap side panel**          | `components/interfaces/Organization/BillingSettings/CostControl/SpendCapSidePanel.tsx`                                                                                                                                                                                                                                                   | Side panel          | Related billing panel; links back to plan panel                                                                                                   | Low–Med    |
| **New org + plan + payment**      | `pages/new/index.tsx`<br>`components/interfaces/Organization/NewOrg/NewOrgForm.tsx`                                                                                                                                                                                                                                                      | Full page           | Long single form (org, plan, Stripe); natural split: details → plan → payment → review                                                            | High       |

**Plan change flow today:**

```
Subscription.tsx
  └─ PlanUpdateSidePanel (panelKey: 'subscriptionPlan')
       ├─ Plan cards → selectedTier
       ├─ tier_free → CancellationFlow
       └─ tier_pro / tier_team → SubscriptionPlanUpdateDialog
            ├─ PaymentMethodSelection
            ├─ Invoice / proration breakdown
            └─ on success → UpgradeModal
```

---

### Database, replication, and integrations

| Flow                             | Files                                                                                                                         | Surface    | Fit                                                                                                      | Complexity |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------- | ---------- |
| **Replication destination edit** | `components/interfaces/Database/Replication/DestinationPanel/DestinationPanel.tsx`<br>`DestinationForm/index.tsx`             | Sheet      | Create wizard sibling; marker doc keeps create vs edit separate. Could adopt stepped sections internally | High       |
| **Create database function**     | `components/interfaces/Database/Functions/CreateFunction/index.tsx`                                                           | Sheet      | Long multi-section form                                                                                  | Med–High   |
| **Database RLS policy editor**   | `components/interfaces/Database/Policies/PolicyEditorPanel/index.tsx`                                                         | Sheet      | Templates/tabs + validation; overlaps storage policy pattern                                             | Med–High   |
| **Create wrapper (FDW)**         | `components/interfaces/Integrations/Wrappers/CreateWrapperSheet.tsx`                                                          | Sheet      | Multi-section (extensions, schema, tables, credentials)                                                  | Med        |
| **Install integration**          | `components/interfaces/Integrations/Integration/IntegrationOverviewTabV2/InstallIntegrationSheet/InstallIntegrationSheet.tsx` | Sheet      | Install + settings sections                                                                              | Low–Med    |
| **Create cron job**              | `components/interfaces/Integrations/CronJobs/CreateCronJobSheet/CreateCronJobSheet.tsx`                                       | Sheet      | Branching by job type in one sheet                                                                       | Med        |
| **Create queue**                 | `components/interfaces/Integrations/Queues/CreateQueueSheet/CreateQueueSheet.tsx`                                             | Sheet      | Integration create sheet                                                                                 | Low–Med    |
| **Spreadsheet / table import**   | `components/interfaces/TableGridEditor/SidePanelEditor/SpreadsheetImport/SpreadsheetImport.tsx`<br>`useSpreadsheetImport.ts`  | Side panel | Upload → configure → preview → apply                                                                     | Med        |

---

### Infrastructure (future)

| Flow                         | Files                                                                                                                                          | Surface                    | Fit                                              | Complexity |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- | ------------------------------------------------ | ---------- |
| **Postgres upgrade**         | `components/interfaces/Settings/General/Infrastructure/ProjectUpgradeAlert.tsx`<br>`components/layouts/ProjectLayout/UpgradingState/index.tsx` | Full page / blocking state | Upgrade disables much of Studio during operation | Med–High   |
| **Multigres sharding setup** | TBD                                                                                                                                            | TBD                        | Pipeline-like complexity expected                | TBD        |

---

### Lower fit (different pattern)

| Flow                           | Files                                                                                     | Why lower fit                                                         |
| ------------------------------ | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| **Create private app**         | `components/interfaces/Organization/PrivateApps/Apps/CreateAppSheet/`                     | Numbered steps but async advancement on API success, no shared footer |
| **New project creation**       | `pages/new/[slug].tsx`<br>`components/interfaces/ProjectCreation/ProjectCreationForm.tsx` | `WizardLayout` but single long form                                   |
| **Connect sheet**              | `components/interfaces/ConnectSheet/ConnectSheet.tsx`                                     | Instructional steps, not validated create form                        |
| **AWS Marketplace onboarding** | `components/interfaces/Organization/CloudMarketplace/AwsMarketplaceOnboarding.tsx`        | Multi-state screen, not form wizard                                   |
| **OAuth API authorization**    | `components/interfaces/ApiAuthorization/ApiAuthorization.Form.tsx`                        | Interstitial authorize page                                           |
| **Publish OAuth app**          | `components/interfaces/Organization/OAuthApps/PublishAppSidePanel/index.tsx`              | Long single side panel                                                |
| **Feedback dropdown**          | `components/layouts/Navigation/LayoutHeader/FeedbackDropdown/FeedbackDropdown.tsx`        | 3-stage popover                                                       |

---

### When migrating

1. Prefer **sheet or full-page** flows that already have Back + forward action semantics.
2. Keep **edit** and **create** as separate surfaces unless there is a strong reason to merge (see create vs edit above).
3. Do not port **modal chains** verbatim; design explicit steps first (especially plan change).
4. Add the flow to this table when migration starts; mark done when merged.

---

## Key files (create pipeline reference)

| File                                              | Role                                                       |
| ------------------------------------------------- | ---------------------------------------------------------- |
| `components/ui/SteppedFlow/SteppedFlow.tsx`       | Layout primitive                                           |
| `CreatePipeline/CreatePipelineWizard.tsx`         | Wizard orchestration                                       |
| `CreatePipeline/CreatePipelineWizard.utils.ts`    | Steps, field lists, validity helpers, merge on type change |
| `CreatePipeline/PipelineReviewSummary.tsx`        | Review read-only UI + section Edit                         |
| `CreatePipeline/PipelineValidationAdmonition.tsx` | Sandwiched section failures                                |
| `Replication/PR_SPLIT.marker.md`                  | PR split notes for this branch (not pattern guidance)      |

---

## Changelog

| Date       | Change                                                                  |
| ---------- | ----------------------------------------------------------------------- |
| 2026-08-20 | Initial pattern doc from create pipeline wizard iteration               |
| 2026-08-20 | Documented return-to-review removal and destination type change lessons |
| 2026-08-20 | Added migration candidates list (incl. subscription plan change)        |
| 2026-08-20 | Footer label: Continue → Next; restored Edit destination on review      |
| 2026-08-20 | Trimmed internal process from migration and when-to-use guidance        |
