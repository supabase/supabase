# Temporary access — tier gating matrix

**Status:** Reflects shipped Studio UI (JIT feature preview, June 2026)  
**Principle:** Security features on lower tiers; customization on higher tiers (Etienne Stalmans, JIT catchup Jun 2026)

Entitlement hook: `useHasAccessToProjectLevelPermissions` → `project_scoped_roles` ([org-subscription-query.ts](../../data/subscriptions/org-subscription-query.ts)).

---

## Summary matrix

| Capability                                | Free | Pro  | Team     | Enterprise   |
| ----------------------------------------- | ---- | ---- | -------- | ------------ |
| Temporary access with expiry              | Yes  | Yes  | Yes      | Yes          |
| External collaborator role                | Yes¹ | Yes¹ | Yes      | Yes          |
| Manage database access (existing members) | Yes  | Yes  | Yes      | Yes          |
| My access hub                             | Yes  | Yes  | Yes      | Yes          |
| Connect sheet JIT awareness               | Yes  | Yes  | Yes      | Yes          |
| Auto-enable PAM on first grant (Studio)   | Yes  | Yes  | Yes      | Yes          |
| Project-scoped member invites             | —    | —    | Yes²     | Yes          |
| IP / CIDR restrictions                    | —    | —    | Yes²     | Yes          |
| Custom permission templates at invite     | —    | —    | —        | Yes (future) |
| Auto-mint scoped PAT at onboarding        | —³   | —³   | —³       | —³           |
| Management API for programmatic grants    | —    | —    | Partial⁴ | Full         |
| Audit log entries for grant lifecycle     | —    | —    | Roadmap  | Roadmap      |
| Extension request flow (guest → admin)    | —    | —    | Roadmap  | Roadmap      |
| Expiry notifications (email)              | —    | —    | Roadmap  | Roadmap      |

¹ External collaborator is always project-scoped (one project per invite); available on all plans. Team gates **full member** invites to specific projects only.  
² Gated in UI via `project_scoped_roles` entitlement.  
³ Onboarding interstitial links to manual scoped token creation; backend auto-mint pending.  
⁴ Read/write grants via existing JIT API today; unified invite payload pending.

---

## Studio UI enforcement (shipped)

| Surface                                     | Without Team entitlement                                              | With Team entitlement                                 |
| ------------------------------------------- | --------------------------------------------------------------------- | ----------------------------------------------------- |
| Invite → Access scope (Developer/Read-only) | Radio locked to all projects; **Team** `Badge` on “Specific projects” | Full `TeamAccessScopeSelector` (all or multi-project) |
| Update roles panel → project scope          | Same radio + **Team** `Badge`                                         | Project picker + per-project roles                    |
| Grant form → IP restrictions                | **Team** `Badge`; fields replaced with unavailable copy               | Full IP/CIDR inputs                                   |
| Invite → External collaborator              | Enabled when user can invite members; pick one project                | Same                                                  |

Upgrade components: standard `Badge` from `ui` for full-member project scope and IP fields.

---

## Free vs Team: two paths to project-scoped access

| Path                                          | Free / Pro                                             | Team+                       |
| --------------------------------------------- | ------------------------------------------------------ | --------------------------- |
| **External collaborator** (JIT guest invite)  | Yes — pick one project; Postgres access from JIT grant | Same                        |
| **Developer / Read-only** → specific projects | No — locked to all projects (`project_scoped_roles`)   | Yes — Access scope combobox |

On Free/Pro, `/roles` may omit **Read-only** until project-level permissions are enabled. External collaborator invites still work: Studio sends **Developer** + `role_scoped_projects` as a platform API stand-in when Read-only is absent; the **JIT grant** defines database access. A dedicated guest platform role is backend follow-up.

Full members cannot get project-scoped **org** access without Team — only the JIT guest path above.

## Postgres roles on guest invite (Studio today)

External collaborator invites use the **same role list as Manage database access** — built-ins plus assignable custom roles from project SQL. This is **not** limited to predefined templates in the current Studio build (preview). Server-side tier caps on role choice are future work.

Built-ins always shown: `postgres`, `supabase_read_only_user`. Custom roles must pass the assignability filter (`canLogin`, not system/reserved roles). Hidden roles notice appears below the role list when filtered custom roles exist.

---

## Entitlement mapping

| Feature flag / entitlement   | Gates                                                                        |
| ---------------------------- | ---------------------------------------------------------------------------- |
| `project_scoped_roles`       | Project-scoped member invites; multi-project External collaborator           |
| Custom Permissions platform  | Enterprise custom templates at invite (future)                               |
| `jitDbAccess` (feature flag) | All temporary access UI in Studio                                            |
| SSO (`auth.platform.sso`)    | SSO upsell above Team table; invitation type in invite sheet when configured |

---

## Upgrade prompts (UX copy)

| Scenario                                      | Plan shown | Copy / pattern                                                                                       |
| --------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------- |
| Developer/Read-only tries specific projects   | Team       | Description: “Invite members to specific projects on Team plan and above”; **Team** `Badge` on radio |
| IP restrictions on grant form                 | Team       | Description: “Restrict database access by IP on Team plan and above”; **Team** `Badge` on label      |
| External collaborator, multi-project Free/Pro | —          | Pick one project in invite sheet (no Team required)                                                  |
| Custom templates (future)                     | Enterprise | TBD                                                                                                  |

---

## Open questions

1. **Server-side tier enforcement** — UI gates today; should API reject IP / multi-project guest invites on Free/Pro?
2. **Max expiry caps per tier** — enforce server-side or trust UI validation?
3. **Postgres role picker on Free/Pro** — Studio shows full list in preview; align with Enterprise-only custom templates later?

---

## Decision log

| Date       | Decision                                                    | Rationale                                                                             |
| ---------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------- | ---------------- |
| 2026-06-23 | Core temp access not paywalled                              | Etienne: security should not be a paid feature                                        |
| 2026-06-24 | Auto-enable on first grant (Option B)                       | Granting DB access IS the opt-in; remove Database Settings toggle from admin UX       |
| 2026-06-24 | External contractor = org guest                             | Visible in Team as External collaborator / Guest badge                                |
| 2026-06-25 | External collaborator on Free without Read-only in `/roles` | Developer + project scope as API stand-in; JIT grant is source of truth for DB access | Shipped (Studio) |
