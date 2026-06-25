# Temporary access — product decisions log

**Branch:** `dnywh/feat/holistic-access`  
**Status:** Living document — append decisions as the feature evolves  
**Related:** [PR-FAQ](./PR-FAQ.md) · [Tier matrix](./TIER-MATRIX.md) · [Stakeholder review](./STAKEHOLDER-REVIEW.md)

---

## Purpose

Single source of truth for **product**, **UX**, and **engineering** decisions made while shipping temporary access into production Studio. Use this when presenting to stakeholders, writing API specs, or onboarding engineers.

---

## Vision (unchanged)

Unify temporary database access into **Organization → Team** — one admin flow for invites and member access, one member home (**Account → My access**), auto-enable PAM on first grant, scoped PAT at onboarding.

Customer-facing term: **temporary access**. Internal/backend term: **JIT** (Just-in-Time database access).

---

## Decision log

| Date       | Decision                                                                                 | Rationale                                                                                                          | Status                  |
| ---------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ----------------------- |
| 2026-06-23 | Core temp access not paywalled                                                           | Security should not be a paid feature (Etienne)                                                                    | Agreed                  |
| 2026-06-24 | Auto-enable PAM on first grant                                                           | Granting DB access _is_ the opt-in; remove Database Settings toggle from admin UX                                  | Shipped (Studio)        |
| 2026-06-24 | Team is source of truth for people + DB access                                           | No parallel JIT rules table in Database Settings                                                                   | Shipped (Studio)        |
| 2026-06-24 | Unified **Access scope** control                                                         | Replace “all projects” toggle + separate project picker with one combobox (all vs specific projects, multi-select) | Shipped (Studio)        |
| 2026-06-24 | Invite form order: **Email → Role → Access scope**                                       | Batch emails first; one role + scope per submit                                                                    | Shipped (Studio)        |
| 2026-06-24 | Owner / Administrator → org-wide scope only                                              | Role implies scope; no project subset for these roles                                                              | Shipped (Studio)        |
| 2026-06-24 | Batch invite = same role + scope for all emails                                          | API model; per-person differences need separate invites or post-join **Manage access**                             | Agreed                  |
| 2026-06-25 | **Remove separate “Access type” field**                                                  | “Full team member” duplicated Role; access type belongs _in_ Role                                                  | Shipped (Studio)        |
| 2026-06-25 | **External collaborator** is a Role choice, not a sibling field                          | Guest path selected alongside Owner / Admin / Developer / Read-only                                                | Shipped (Studio)        |
| 2026-06-25 | Collapse **external-collaborator** + **database-only** into one guest path               | Both were org guest + project-scoped JIT; differed only in Studio surface vs connection-only                       | Shipped (Studio)        |
| 2026-06-25 | Guest invites: **Postgres template** (Read-only / Developer) + **expiry** at invite time | Configure access when sending invite, not as a follow-up admin task                                                | UI shipped; API pending |
| 2026-06-25 | Pending grant stored on invitation, applied on **accept**                                | JIT API requires `user_id`; invitee does not exist until accept                                                    | Agreed; API pending     |

| 2026-06-25 | Guest invites: **Postgres roles and settings** matches Manage access sheet | Full role list, IP restrictions, branch scope, expiry — not simplified templates | Shipped (Studio) |
| 2026-06-25 | **Expiry semantics split by context** | Manage access: relative presets → absolute timestamp at save. Invite presets: `expires_after_seconds` from **accept**. Invite custom: absolute `expires_at`. | Shipped (Studio) / API pending |

| 2026-06-25 | **Builtin JIT roles** always listed: `postgres`, `supabase_read_only_user` | postgres is a superuser in PG but excluded by old filter; custom roles merged from project SQL when available | Shipped (Studio) |
| 2026-06-24 | **Team table** shows Role, Access scope, expiry metadata (DEPR-585) | Split role from project scope; JIT expiry as subtext under access scope | Shipped (Studio) |
| 2026-06-24 | **Remove Database Settings JIT UI entirely** | Single admin surface: Team invite + Manage database access | Shipped (Studio) |
| 2026-06-24 | **Migration / upgrade notices** on grant forms only | Postgres upgrade, manual migration, preview-branch — shown when configuring access on a project, not on Database Settings | Shipped (Studio) |
| 2026-06-24 | **Hidden custom roles** notice on External collaborator invite only | Dynamic text below role list when roles exist but fail assignability filter (e.g. login disabled); Database → Roles create flow unchanged | Shipped (Studio) |
| 2026-06-24 | **Do not** change Database → Roles create defaults for JIT | Custom roles serve many purposes (including NOLOGIN group roles); invite flow explains gaps instead | Agreed |
| 2026-06-24 | **Delete Postgres role** warns if JIT grants reference it | JIT grants stored separately by role name; delete does not auto-revoke Team grants | Shipped (Studio) |
| 2026-06-24 | **SSO upsell** above Team table, not in invite sheet | Org capability; invite keeps **Invitation type** only when SSO provider exists | Shipped (Studio) |

---

## Postgres roles on guest invite

**Not custom-only.** External collaborator invites use the same role list as **Manage database access**:

| Source               | Roles                                                            |
| -------------------- | ---------------------------------------------------------------- |
| **Always shown**     | `postgres`, `supabase_read_only_user` (built-in JIT targets)     |
| **From project SQL** | Additional custom login roles that pass the assignability filter |

`postgres` is a superuser in Postgres but is intentionally grantable (with a warning in the UI). The previous `!isSuperuser` filter incorrectly hid it. Built-ins are merged into the list even when the roles query fails or has not returned yet.

### Assignability filter (custom roles)

Custom roles from project SQL appear only when they pass `isAssignableTemporaryAccessRole`:

| Requirement                                       | Reason                       |
| ------------------------------------------------- | ---------------------------- |
| `canLogin === true`                               | JIT connects as a login role |
| Not superuser (except built-ins)                  | Safety                       |
| Not `pg_*`, `pgbouncer`, `authenticator`          | System / pooler roles        |
| Not `supabase_*` except `supabase_read_only_user` | Reserved Supabase roles      |

**Database → Roles is independent of Team invite.** Creating a role with default `canLogin: false` is valid Postgres (e.g. NOLOGIN group roles). We do **not** change create-role defaults for temporary access.

**External collaborator invite only:** when **user-managed custom** roles exist in the project but are not assignable (e.g. login disabled), show dynamic copy **below the role options list** (right column), e.g.  
`1 custom role is not shown for temporary access: my_role (login disabled).`  
Uses the same `SUPABASE_ROLES` partition as Database → Roles — Supabase-managed and system roles are omitted. Only shown after the project roles query returns.

### SSO and invite

| Concern                     | How we handle it today                                                                                      |
| --------------------------- | ----------------------------------------------------------------------------------------------------------- |
| SSO not on plan             | Upsell admonition above Team table (`TeamSsoAvailableAdmonition`)                                           |
| SSO on plan, not configured | “Set up SSO” admonition above table → org SSO settings                                                      |
| SSO provider configured     | **Invitation type** inside invite sheet: auto / require SSO / email-password                                |
| Invite payload              | `buildSsoPayload(requireSso)` → optional `requireSso: true \| false` on invitation API                      |
| External collaborator + JIT | Orthogonal: SSO controls **auth method**; JIT fields control **Postgres access**. Both sent on same invite. |
| Domain / IdP matching       | Not validated in Studio — invitee must be able to sign in via chosen method after accept                    |

No extra SSO-specific fields on guest JIT grant section. If `requireSso: true`, guest must complete SSO onboarding; pending DB grant still applies on accept (API pending).

---

### Manage database access (existing members)

The JIT grant sheet labels the field **“Expires in”** with presets (1 hour, 1 day, …). Choosing a preset computes an **absolute** `expires_at` timestamp **at the moment the admin saves** and shows it as “Expires at DD MMM, HH:mm”.

### External collaborator invite (pending grant)

| UI choice                   | Stored on invitation    | When access ends                                 |
| --------------------------- | ----------------------- | ------------------------------------------------ |
| Preset (1h / 1d / 7d / 30d) | `expires_after_seconds` | Duration starts **when they accept**             |
| Custom date picker          | `expires_at` (unix)     | Fixed wall-clock time, regardless of accept time |

**Why not “1 hour from invite sent”?** The invitee may accept hours later; duration should start when access is actually granted (accept), not when the email was sent.

**Why custom absolute on invite?** For scheduled access windows (“until Friday 5pm”) where the end time is wall-clock, not relative to accept.

Guest invites **cannot** use “Never” expiry.

---

## Invite form model (current)

### Bordered sections (mental model for QA)

The invite sheet uses `SheetSection` dividers. When walking the UI or writing tests, number sections like this:

| #   | Section            | When shown                                                                                                   | What to verify                                                                                                             |
| --- | ------------------ | ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Member**         | Always                                                                                                       | Email batch, Role radio cards (incl. External collaborator when JIT preview on)                                            |
| 2   | **Access**         | Full members → **Access scope**. External collaborator → **Project scope** + **Postgres roles and settings** | Scope combobox or project picker; grant rows, migration notice, hidden-role helper below role list when applicable         |
| 3   | **Authentication** | **Only when SSO provider is configured** (`hasSsoProvider` from org SSO config)                              | **Invitation type** select: Automatic (based on your account) / Require SSO authentication / Email/password authentication |

**Manual QA — do not skip section 3:** Requires an org with SSO **already configured** (not just entitled). Upsell/setup admonitions live **above the Team table**, not in the invite sheet. If you only test on orgs without SSO, the Authentication section never appears and `requireSso` is never sent.

### All invites

1. **Email addresses** — batch (same config for every address in one submit)
2. **Role**
3. Role-dependent fields (below)
4. **Invitation type** (SSO) — section **3 — Authentication** when org has SSO configured

### Full team members (Owner, Administrator, Developer, Read-only)

| Role                 | Access scope                                                          |
| -------------------- | --------------------------------------------------------------------- |
| Owner, Administrator | Locked: all projects (current and future)                             |
| Developer, Read-only | **Access scope** combobox: all projects or one/more specific projects |

### External collaborator (JIT preview / feature flag)

Shown as an extra **Role** option when `jitDbAccess` preview is enabled.

| Field                           | Notes                                                                                             |
| ------------------------------- | ------------------------------------------------------------------------------------------------- |
| **Project scope**               | Single project (required)                                                                         |
| **Postgres roles and settings** | Same as Manage database access: role checkboxes, branch scope, expires after accept, optional IPs |

**Platform mapping today:** Read-only org role + `role_scoped_projects: [ref]`.  
**Platform mapping target:** `pending_access_grant` on invitation → applied on accept.

**Removed copy:** “Configure database access after they accept” — replaced with invite-time fields and toast: _“Temporary database access will be ready when they accept the invitation.”_

**Invite grant section:** No section-level description — expiry semantics are explained on each role row (`Expires after accept` in `TemporaryAccessGrantFields`). Hidden-role notice below the role list when custom roles are filtered out.

---

## Team member list (DEPR-585)

| Column                    | Content                                                             |
| ------------------------- | ------------------------------------------------------------------- |
| **Member**                | Email, You / Invited / SSO / **Guest** badges                       |
| **MFA**                   | Enabled / Disabled                                                  |
| **Role**                  | Org role name(s) only                                               |
| **Access scope**          | All projects, single project name, or `N projects` (hover for list) |
| **Access scope metadata** | JIT expiry when applicable, e.g. `Database access expires in 2h`    |

Guest badge stays on the member cell. Active/expired JIT timing moved from member badges to access scope subtext.

---

## What we removed / deprecated

| Removed                                                                           | Replaced by                                                                |
| --------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Top-level **Access type** (full member / external / database-only)                | **Role** includes External collaborator                                    |
| **Database access only** as separate type                                         | Postgres role picker under External collaborator                           |
| **Grant this role on all projects** toggle                                        | **Access scope** combobox                                                  |
| **Select a project** (single) for full members                                    | Multi-select in **Access scope**                                           |
| **Database Settings → Temporary access** section (entire `JitDatabaseAccess/` UI) | Team invite + **Manage database access**; migration notices on those forms |

PAM auto-enable still uses `PUT /v1/projects/{ref}/jit-access` behind the scenes (`useAutoEnableJitAccess`) — no admin toggle.

---

## Delete Postgres role vs JIT grants

Two separate layers:

1. **Postgres role** — deleted via Database → Roles; revokes membership in other PG roles.
2. **JIT grant** — stored per project via `PUT /v1/projects/{ref}/database/jit` as a role **name** string.

Deleting a Postgres role does **not** automatically remove JIT grant rows today. Affected members may still show a grant in Team until revoked; connections as that role will fail.

**Studio (when JIT preview on):** delete-role confirmation lists team members with JIT grants for that role and advises revoking from Team first. Delete is **not** blocked.

**Future (backend):** optional cascade revoke or reject delete while active grants exist.

---

## Backend work required

### P0 — unblock invite-time guest configuration

| Change                        | Description                                                                                                                                         |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Extend `CreateInvitationBody` | Add `pending_access_grant`: `project_ref`, `roles[]` with `expires_at` **or** `expires_after_seconds`, optional `branches_only`, `allowed_networks` |
| Apply grant on accept         | When invitation is accepted, create JIT grant via existing `PUT /v1/projects/{ref}/database/jit` using stored payload + new `user_id`               |
| Auto-enable PAM               | Server-side `PUT /v1/projects/{ref}/jit-access` on first grant (if not already enabled)                                                             |
| Auto-mint scoped PAT          | On accept, mint PAT bounded by grant (Kamal / scoped access)                                                                                        |

**Studio readiness:** `buildPendingInvitationAccessGrant()` + `OrganizationCreateInvitationVariables.pendingAccessGrant` — wired in UI, **not yet sent** in HTTP body until API types land.

### P0 — member experience

| Change                                | Description                                                          |
| ------------------------------------- | -------------------------------------------------------------------- |
| `GET /platform/profile/access-grants` | Cross-project grant list for **My access** without per-project `ref` |

### P1 — edit / lifecycle

| Change                         | Description                                     |
| ------------------------------ | ----------------------------------------------- |
| Extend member update mutations | Same grant fields for extend / revoke / edit    |
| Team list refresh on revoke    | SEC-463 cascade; ensure UI reflects immediately |
| Audit log events               | `access_grant.created`, `.expired`, `.revoked`  |

### Future

- Dedicated **External collaborator** platform role (today: Read-only + guest UX + JIT grant)
- IP/CIDR at invite (Team+ entitlement) — UI present; enforce server-side per tier
- Custom permission templates at invite (Enterprise)
- Expiry notification emails
- Guest extension request flow

---

## API shapes (proposed)

### Pending grant on invitation

```json
{
  "emails": ["contractor@example.com"],
  "role_id": 4,
  "role_scoped_projects": ["abcdefghijklmnop"],
  "pending_access_grant": {
    "project_ref": "abcdefghijklmnop",
    "roles": [
      {
        "role": "supabase_read_only_user",
        "expires_after_seconds": 3600,
        "branches_only": false,
        "allowed_networks": {
          "allowed_cidrs": [{ "cidr": "203.0.113.0/24" }]
        }
      }
    ]
  }
}
```

### Accept flow (server)

1. Create org membership (existing)
2. If `pending_access_grant` present → enable JIT on project if needed → `PUT .../database/jit`
3. Mint scoped PAT → onboarding payload for join interstitial

---

## Studio implementation map

| Surface                          | Path                                                    | Notes                                                |
| -------------------------------- | ------------------------------------------------------- | ---------------------------------------------------- |
| Invite sheet                     | `TeamSettings/InviteMemberButton.tsx`                   | Role-first; guest fields when External collaborator  |
| SSO upsell / setup               | `TeamSettings/TeamSsoAvailableAdmonition.tsx`           | Above members table; hidden when SSO configured      |
| Access scope                     | `TeamSettings/TeamAccessScopeSelector.tsx`              | Shared combobox                                      |
| Manage access (existing members) | `TemporaryAccess/TemporaryAccessGrantSheet.tsx`         | Full grant editor                                    |
| Team table                       | `TeamSettings/MemberRow.tsx`, `MembersView.tsx`         | Role / Access scope / expiry (DEPR-585)              |
| Team member utils                | `TeamSettings/TemporaryAccessMember.utils.ts`           | Scope display, JIT summary, guest detection          |
| Project unavailable notices      | `TemporaryAccess/TemporaryAccessProjectNotice.tsx`      | Migration, PG17 upgrade, preview branch              |
| Hidden roles (invite only)       | `TemporaryAccess/TemporaryAccessInviteGrantSection.tsx` | Dynamic copy below role list after roles query loads |
| My access                        | `account/access`                                        | Member grant hub                                     |
| Connect sheet                    | `TemporaryAccessConnectNotice`                          | JIT role picker                                      |
| Join onboarding                  | `TemporaryAccessOnboarding`                             | Post-accept interstitial                             |
| Invite grant builder             | `TemporaryAccess/TemporaryAccessInvite.utils.ts`        | Pending grant payload + validation                   |
| Invite grant UI                  | `TemporaryAccess/TemporaryAccessInviteGrantSection.tsx` | Reuses `TemporaryAccessGrantFields`                  |
| Role delete warning              | `Database/Roles/RolesList.tsx`                          | JIT grant holders when deleting a Postgres role      |
| Auto-enable PAM                  | `TemporaryAccess/useAutoEnableJitAccess.ts`             | On first grant save                                  |

**Removed:** `Settings/Database/JitDatabaseAccess/*` (configuration, rules table, rule sheet).

---

## Open questions

1. **Free tier multi-project orgs** — auto-select sole project vs upgrade prompt when inviting guest?
2. **Read-only template max expiry** — tier matrix allows 30 days for read-only template; invite UI currently caps at 7 days for simplicity.
3. **External collaborator platform role** — when does backend expose a distinct guest role vs Read-only stand-in?
4. **Invitation edit** — can admins change pending grant before accept?
5. **JIT grant cascade on Postgres role delete** — should backend auto-revoke grants when role is dropped?

---

## How to update this doc

When making a product or UX decision:

1. Add a row to **Decision log** with date, decision, rationale, status (`Agreed` / `Shipped` / `API pending` / `Deferred`).
2. Update **Invite form model** or **Backend work required** if behavior or contracts change.
3. Link PRs or Linear issues in the rationale when available.

---

## Presentation outline (for stakeholders)

1. **Problem** — fragmented JIT config; contractors need time-limited DB access without full Studio.
2. **Solution** — Team-centric invite + manage; My access for members.
3. **Key UX bets** — Role drives everything; access scope unified; guest config at invite time.
4. **What’s shipped in Studio** — table from Decision log (`Shipped` rows).
5. **What’s blocked** — Backend table (P0).
6. **Tier matrix** — point to [TIER-MATRIX.md](./TIER-MATRIX.md).
7. **Demo path** — invite → accept → onboarding → My access → Connect.
