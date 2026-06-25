# Temporary access via Team invites — PR/FAQ

**Status:** Shipped in Studio (JIT feature preview, June 2026)  
**Authors:** Product Design + Security  
**Reviewers:** Etienne Stalmans, Kamal (scoped PATs), Johnny (scoped access)

---

## Press release

**Supabase introduces temporary database access through Team invites**

Today, Supabase organizations can invite developers with coarse roles—Owner, Administrator, Developer, Read-only—and scope them to specific projects on Team plans. But many teams need something finer: give a contractor direct Postgres access for an hour without handing them the full dashboard, or elevate an internal developer to a specific database role temporarily without changing their org role.

With this release, Supabase unifies temporary database access into the same flow you already use to invite team members. From **Organization → Team → Invite members**, admins pick a **Role** (including **External collaborator** for guests), set project scope, Postgres roles, and expiry, then send the invite. The platform automatically enables authenticated Postgres connections on the project when an admin first grants access—no separate configuration in Database Settings. Invitees are guided to create a scoped access token and can return to **Account → My access** for grant status.

External collaborators join as org guests: visible in Team with a **Guest** badge, connection-first in experience, and automatically revoked when database access expires.

---

## FAQ

### Customer-facing

**What is temporary access?**

Temporary access lets Supabase organization members (and invited external collaborators) connect directly to Postgres using a Supabase access token as the password. Access is tied to a specific user, can expire automatically, and can be restricted by Postgres role and optionally by IP address (Team+).

**How is this different from sharing the database password?**

The shared `postgres` role password is a long-lived credential. Temporary access binds authentication to an individual Supabase account and a scoped token. When access expires or is revoked, that user's connections stop working—even if they still have a valid token elsewhere.

**Where do I manage temporary access?**

In **Organization → Team**. Invite a new member or use **Manage database access** on an existing member. Database Settings is not used to manage people or JIT rules.

**Do I need to enable anything in Database Settings first?**

No. The first time you grant someone database access through Team, Supabase enables authenticated Postgres connections on that project automatically.

**Who can I invite?**

Anyone with a Supabase account whose email matches the invitation. They sign in or create an account at the join link. External collaborators appear in your Team list with a **Guest** badge.

**How do roles work on the invite sheet?**

There is no separate “access type” field. **Role** drives everything:

- **Owner, Administrator, Developer, Read-only** — standard org members with org/project scope as today
- **External collaborator** — org guest with project-scoped temporary Postgres access configured at invite time

**What is the default expiry for external collaborators?**

Presets start at 1 hour; custom dates are supported. Guest invites cannot use “Never” expiry. Expiry for invite presets runs from **when the invitee accepts**, not when the invite was sent.

**How does the invitee connect?**

After accepting, guest invitees can land on a join interstitial with grant summary and a link to create a scoped access token. **Account → My access** lists active and expired grants per project. The **Connect** sheet Direct connection tab shows a notice and Postgres role picker when the member has active grants on that project.

**What happens when access expires?**

Postgres rejects new connections for that user. Admins see expiry metadata under the member's **Access** column in Team. Members see expired state in My access.

**Can internal project members use temporary elevated database access?**

Yes. Members with grants see them in the **Connect** sheet under Direct connection, including a role picker when multiple Postgres roles are granted.

**Which plans support this?**

Core temporary access—including expiry, External collaborator, and the My access hub—is available on all plans. **Project-scoped invites for full members** (Developer/Read-only) and **IP restrictions** require Team or above. Custom permission templates require Enterprise (future).

**Is this the same as Just-in-Time (JIT) access?**

Yes, internally. Customer-facing copy uses **temporary access**. The underlying PAM authentication and grant APIs remain; only the admin and member experience is unified.

**How do I try it?**

Enable **Temporary access** under Account → Feature previews (`jitDbAccess`).

---

### Internal / engineering

**What backend work already exists?**

PAM-based JIT authentication, project enable/disable API, per-user grant CRUD, Supavisor pooler support, branching, and non-project-member grants (SEC-811).

**What is shipped in Studio UI?**

- Team invite sheet with External collaborator role + grant fields
- **Manage database access** grant sheet for existing members
- Team table: Member (with MFA subtext), Role, Access, Actions
- Tier upgrade nudges: Team `Badge` on project scope; `(requires Team)` on External collaborator when multi-project without entitlement; Team `Badge` on IP restrictions
- **Account → My access** (`/account/access`)
- Connect sheet notice + role picker
- Post-accept onboarding interstitial (`/join/temporary-access`) — guidance only, no auto-mint yet
- Database Settings JIT admin UI removed

**What is still blocked on backend?**

| Gap                                      | Impact                                                     |
| ---------------------------------------- | ---------------------------------------------------------- |
| `pending_access_grant` on invitation API | Guest invite-time DB config not applied on accept          |
| `GET /platform/profile/access-grants`    | My access uses N+1 org projects + per-project self queries |
| Auto-mint scoped PAT on accept           | Onboarding links to manual token creation                  |
| Server-side tier enforcement             | UI gates only today                                        |

**What's the relationship to Custom Permissions?**

Custom Permissions (Enterprise) provides invite-time templates. Temporary access expiry is on the grant lifecycle—orthogonal concerns.

**Migration impact?**

Existing JIT grant data maps 1:1 to access grants. No customer data migration expected.

---

## Problem

Enterprise and security-conscious teams need **time-limited, attributable, revocable** direct database access without full project permissions. The old experience split configuration across Database Settings, Team, and Account Access Tokens—fragmented and undiscoverable.

## Solution

One admin flow (Team invite / Manage database access), one member home (My access), auto-enable PAM on first grant, scoped PAT at onboarding (backend pending).

## Tenets

1. **Granting access is the opt-in** — no separate PAM toggle step for admins
2. **Team is the source of truth** — no parallel rules table in Database Settings
3. **Connection-first for guests** — External collaborators live in My access, not full Studio
4. **Security on all tiers** — customization on Enterprise
5. **Backend reuse** — unify UX, not rewrite PAM

## Success metrics (proposed)

- Time to grant temporary DB access (admin task completion)
- Invitee time from accept → first successful connection
- Support tickets related to "can't find my token" / "access expired"
- Adoption of External collaborator vs full Developer invites for contractor use cases

## Non-goals (this release)

- Org-level global kill switch UI (future security policy)
- Time-of-day / geo restrictions (future Advanced options)
- SCIM / programmatic org membership (separate track)
