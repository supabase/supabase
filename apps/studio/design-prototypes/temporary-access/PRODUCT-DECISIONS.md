# Temporary access — product decisions log

**Branch:** `dnywh/studio-temporary-access-ui`  
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

---

## Postgres roles on guest invite

**Not custom-only.** External collaborator invites use the same role list as **Manage database access**:

| Source               | Roles                                                            |
| -------------------- | ---------------------------------------------------------------- |
| **Always shown**     | `postgres`, `supabase_read_only_user` (built-in JIT targets)     |
| **From project SQL** | Additional custom login roles that pass the assignability filter |

`postgres` is a superuser in Postgres but is intentionally grantable (with a warning in the UI). The previous `!isSuperuser` filter incorrectly hid it. Built-ins are merged into the list even when the roles query fails or has not returned yet.

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

### All invites

1. **Email addresses** — batch (same config for every address in one submit)
2. **Role**
3. Role-dependent fields (below)
4. **Invitation type** (SSO) — when org has SSO configured

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

---

## What we removed / deprecated

| Removed                                                            | Replaced by                                      |
| ------------------------------------------------------------------ | ------------------------------------------------ |
| Top-level **Access type** (full member / external / database-only) | **Role** includes External collaborator          |
| **Database access only** as separate type                          | Postgres role picker under External collaborator |
| **Grant this role on all projects** toggle                         | **Access scope** combobox                        |
| **Select a project** (single) for full members                     | Multi-select in **Access scope**                 |
| Database Settings JIT rules UI                                     | Team invite + **Manage database access**         |

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

| Surface                          | Path                                                    | Notes                                               |
| -------------------------------- | ------------------------------------------------------- | --------------------------------------------------- |
| Invite sheet                     | `TeamSettings/InviteMemberButton.tsx`                   | Role-first; guest fields when External collaborator |
| Access scope                     | `TeamSettings/TeamAccessScopeSelector.tsx`              | Shared combobox                                     |
| Manage access (existing members) | `TemporaryAccess/TemporaryAccessGrantSheet.tsx`         | Full grant editor                                   |
| Team badges                      | `TeamSettings/MemberRow`                                | Expiry / guest badges                               |
| My access                        | `account/access`                                        | Member grant hub                                    |
| Connect sheet                    | `TemporaryAccessConnectNotice`                          | JIT role picker                                     |
| Join onboarding                  | `TemporaryAccessOnboarding`                             | Post-accept interstitial                            |
| Invite grant builder             | `TemporaryAccess/TemporaryAccessInvite.utils.ts`        | Pending grant payload + validation                  |
| Invite grant UI                  | `TemporaryAccess/TemporaryAccessInviteGrantSection.tsx` | Reuses `TemporaryAccessGrantFields`                 |

---

## Open questions

1. **Free tier multi-project orgs** — auto-select sole project vs upgrade prompt when inviting guest?
2. **Read-only template max expiry** — tier matrix allows 30 days for read-only template; invite UI currently caps at 7 days for simplicity.
3. **External collaborator platform role** — when does backend expose a distinct guest role vs Read-only stand-in?
4. **Invitation edit** — can admins change pending grant before accept?

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
