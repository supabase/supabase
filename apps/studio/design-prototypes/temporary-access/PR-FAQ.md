# Temporary access via Team invites — PR/FAQ

**Status:** Vision / design prototype (June 2026)  
**Authors:** Product Design + Security  
**Reviewers:** Etienne Stalmans, Kamal (scoped PATs), Johnny (scoped access)

---

## Press release

**Supabase introduces temporary database access through Team invites**

Today, Supabase organizations can invite developers with coarse roles—Owner, Administrator, Developer, Read-only—and scope them to specific projects on Team plans. But many teams need something finer: give a contractor direct Postgres access for an hour without handing them the full dashboard, or elevate an internal developer to a specific database role temporarily without changing their org role.

Starting with this release, Supabase unifies temporary database access into the same flow you already use to invite team members. From **Organization → Team → Invite members**, admins choose an access type, set an expiry, pick Postgres roles, and send the invite. The platform automatically enables authenticated Postgres connections on the project—no separate configuration in Database Settings. Invitees receive a scoped access token and copy-paste connection strings at onboarding, with a persistent **My access** page to return to later.

External collaborators join as org guests with a dedicated **External collaborator** role: visible in Team, connection-first in experience, and automatically revoked when access expires.

---

## FAQ

### Customer-facing

**What is temporary access?**

Temporary access lets Supabase organization members (and invited external collaborators) connect directly to Postgres using a Supabase access token as the password. Access is tied to a specific user, can expire automatically, and can be restricted by Postgres role and optionally by IP address.

**How is this different from sharing the database password?**

The shared `postgres` role password is a long-lived credential. Temporary access binds authentication to an individual Supabase account and a scoped token. When access expires or is revoked, that user's connections stop working—even if they still have a valid token elsewhere.

**Where do I manage temporary access?**

In **Organization → Team**. Invite a new member or edit an existing member's access. You choose the access type, duration, project scope, and database connection settings in one place. Database Settings is not used to manage people.

**Do I need to enable anything in Database Settings first?**

No. The first time you grant someone database access through Team, Supabase enables authenticated Postgres connections on that project automatically.

**Who can I invite?**

Anyone with a Supabase account whose email matches the invitation. They sign in or create an account at the join link. External collaborators appear in your Team list with an **External collaborator** badge.

**What access types are available?**

- **Full team member** — standard org roles (Owner, Admin, Developer, Read-only)
- **External collaborator** — org guest with minimal Studio access and bundled database connection
- **Database access only** — predefined templates on Free/Pro; custom templates on Enterprise (future)

**What is the default expiry?**

One hour for External collaborator and database-only access types. Full team members can have no expiry. Expiry is always shown explicitly when configuring access.

**How does the invitee connect?**

After accepting the invite, they land on an onboarding screen with connection strings (direct Postgres and pooler) and an auto-generated scoped access token. They copy the strings into psql, their IDE, or a CI job. The same information remains available on **Account → My access**.

**What happens when access expires?**

Postgres rejects new connections for that user. The admin sees **Expired** on the member row in Team. The member sees an expired state in My access with guidance to contact their admin.

**Can internal project members use temporary elevated database access?**

Yes. Members with grants see them in the **Connect** sheet under Direct connection, including a role picker when multiple Postgres roles are granted.

**Which plans support this?**

Core temporary access—including expiry, External collaborator, and auto-minted scoped tokens—is available on all plans. Project-scoped invites and IP restrictions require Team or above. Custom permission templates require Enterprise.

**Is this the same as Just-in-Time (JIT) access?**

Yes, internally. Customer-facing copy uses **temporary access**. The underlying PAM authentication and grant APIs remain; only the admin and member experience is unified.

---

### Internal / engineering

**What backend work already exists?**

PAM-based JIT authentication, project enable/disable API, per-user grant CRUD, Supavisor pooler support, branching, and non-project-member grants (SEC-811). See the [PAM for Just-In-Time Database Access](https://linear.app/supabase/project/pam-for-just-in-time-database-access/overview) project.

**What changes in the API model?**

Grants are created and updated through invite/member mutations rather than a separate Database Settings UI. First grant with database connection triggers `PUT /v1/projects/{ref}/jit-access` (enable) automatically.

**How do scoped PATs fit in?**

On invite acceptance, the platform auto-mints a scoped PAT with permissions bounded by the grant. Same permission vocabulary as Kamal's scoped access token work. Legacy PATs continue to work but are not the primary UX.

**What's the relationship to Custom Permissions?**

Custom Permissions (target Aug 2026) provides Enterprise invite-time templates ("SQL Editor only", etc.). Temporary access expiry is on the grant lifecycle, not JSONLogic conditions—orthogonal concerns.

**What new APIs are needed?**

- `GET /platform/profile/access-grants` — list grants across projects without knowing `project_ref` (powers My access)
- Invite/member mutations extended with access grant payload (access type, expiry, postgres roles, IP, branch scope)
- Auto-enable hook on first database grant

**What are we removing from the UI?**

Database Settings JIT rules table and admin toggle. Database Settings may retain a read-only status indicator or link to Team—TBD—not a configuration surface for people.

**Migration impact?**

Existing JIT grant data maps 1:1 to access grants. No customer data migration expected.

---

## Problem

Enterprise and security-conscious teams need to grant **time-limited, attributable, revocable** direct database access without full project permissions. Today's experience splits configuration across Database Settings, Team, and Account Access Tokens—fragmented, undiscoverable, and easy to misconfigure.

## Solution

One admin flow (Team invite/edit), one member home (My access), auto-enable on first grant, scoped PAT at onboarding.

## Tenets

1. **Granting access is the opt-in** — no separate PAM toggle step for admins
2. **Team is the source of truth** — no parallel rules table
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
