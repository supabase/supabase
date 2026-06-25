# Temporary access — tier gating matrix

**Status:** Finalized for design prototype (June 2026)  
**Principle:** Security features on lower tiers; customization on higher tiers (Etienne Stalmans, JIT catchup Jun 2026)

---

## Summary matrix

| Capability                             | Free | Pro  | Team     | Enterprise |
| -------------------------------------- | ---- | ---- | -------- | ---------- |
| Temporary access with expiry           | Yes  | Yes  | Yes      | Yes        |
| External collaborator role             | Yes¹ | Yes¹ | Yes      | Yes        |
| Predefined access templates            | Yes  | Yes  | Yes      | Yes        |
| Auto-mint scoped PAT at onboarding     | Yes  | Yes  | Yes      | Yes        |
| My access hub                          | Yes  | Yes  | Yes      | Yes        |
| Connect sheet JIT awareness            | Yes  | Yes  | Yes      | Yes        |
| Auto-enable PAM on first grant         | Yes  | Yes  | Yes      | Yes        |
| Project-scoped invites                 | —    | —    | Yes²     | Yes        |
| Full Postgres role picker              | —    | —    | Yes      | Yes        |
| IP / CIDR restrictions (Advanced)      | —    | —    | Yes      | Yes        |
| Custom permission templates at invite  | —    | —    | —        | Yes        |
| Management API for programmatic grants | —    | —    | Partial³ | Full       |
| Audit log entries for grant lifecycle  | —    | —    | Yes      | Yes        |
| Extension request flow (guest → admin) | —    | —    | Roadmap  | Roadmap    |
| Expiry notifications (email)           | —    | —    | Roadmap  | Roadmap    |

¹ Single project only on Free/Pro (no `project_scoped_roles` entitlement; org default project or sole project implied).  
² Requires `project_scoped_roles` entitlement ([org-subscription-query.ts](../../data/subscriptions/org-subscription-query.ts)).  
³ Read/write grants via existing JIT API today; unified invite API TBD.

---

## Predefined templates (Free / Pro / all tiers)

Supabase-defined templates—not customer-created. Enterprise adds custom templates on top.

| Template ID                    | Label                          | Platform role          | Postgres role(s)          | Default expiry | Max expiry |
| ------------------------------ | ------------------------------ | ---------------------- | ------------------------- | -------------- | ---------- |
| `external-collaborator`        | External collaborator          | Guest (minimal Studio) | Configurable preset       | 1 hour         | 7 days     |
| `database-developer-temporary` | Database developer (temporary) | None / guest           | `postgres`                | 1 hour         | 7 days     |
| `database-readonly-temporary`  | Database read-only (temporary) | None / guest           | `supabase_read_only_user` | 24 hours       | 30 days    |

On Free/Pro, Postgres role selection is limited to presets within each template (no arbitrary role picker).

---

## Entitlement mapping

| Feature flag / entitlement   | Gates                                                |
| ---------------------------- | ---------------------------------------------------- |
| `project_scoped_roles`       | Project picker on invite; scope to one/many projects |
| Custom Permissions platform  | Enterprise custom templates at invite time           |
| `jitDbAccess` (feature flag) | Backend PAM availability on instance                 |
| SSO (`auth.platform.sso`)    | SSO invitation type on invite sheet                  |

---

## Upgrade prompts (UX copy)

| Scenario                        | Plan shown | Copy direction                                               |
| ------------------------------- | ---------- | ------------------------------------------------------------ |
| Free user tries project scope   | Team       | "Invite members to specific projects on Team plan and above" |
| Pro user tries IP restrictions  | Team       | "Restrict database access by IP on Team plan and above"      |
| Team user tries custom template | Enterprise | "Create custom permission templates on Enterprise"           |

Reuse existing [UpgradePlanButton](apps/studio/components/ui/UpgradePlanButton.tsx) patterns from [InviteMemberButton.tsx](../../components/interfaces/Organization/TeamSettings/InviteMemberButton.tsx).

---

## Open questions for Product / Security sign-off

1. **Free tier single-project assumption** — auto-select sole project vs require upgrade when org has multiple projects?
2. **Max expiry caps** — enforce server-side per tier or trust UI validation?
3. **External collaborator on org-wide scope** — allow on Team+ or always project-scoped?

---

## Decision log

| Date       | Decision                              | Rationale                                                                       |
| ---------- | ------------------------------------- | ------------------------------------------------------------------------------- |
| 2026-06-23 | Core temp access not paywalled        | Etienne: "I hate making security a paid feature"                                |
| 2026-06-24 | Auto-enable on first grant (Option B) | Granting DB access IS the opt-in; remove Database Settings toggle from admin UX |
| 2026-06-24 | External contractor = org guest       | Visible in Team as External collaborator                                        |
