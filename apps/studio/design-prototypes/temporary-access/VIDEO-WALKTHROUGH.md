# Temporary access — video walkthrough recording guide

Use the interactive prototype at **`/design-prototypes/temporary-access`** while narrating. Total runtime target: **~7–8 minutes**.

**Do not show Database Settings** in the recording.

---

## Pre-recording checklist

- [ ] Studio dev server running (`pnpm dev:studio`)
- [ ] Navigate to `/design-prototypes/temporary-access`
- [ ] Screen recorder at 1920×1080 or 1616×1022 (match SEC-888 prototype dimensions)
- [ ] Hide browser bookmarks bar; use clean org/project context if overlay visible
- [ ] Prototype banner visible (confirms design preview mode)

---

## Act 0 — Hook (~30s)

**Screen:** Prototype nav → optional "Before" reference card on index

**Say:**

> Temporary database access works technically—the backend is largely done. But the experience is fragmented. Admins configure access in Database Settings. They separately manage people in Team. Invitees have to find their own access tokens in Account Settings. Connection info is shown once and then lost forever.
>
> We're proposing one model: grant temporary access the same way you invite a team member.

---

## Act 1 — Vision (~45s)

**Screen:** Prototype → **Vision** tab (IA before/after)

**Say:**

> The new home for temporary access is Org → Team. You invite someone, pick what they can do, how long it lasts, and which Postgres roles they can connect as. That's the whole admin flow.
>
> We are not asking admins to visit Database Settings first. When you grant someone database access, we auto-enable authenticated Postgres connections on that project behind the scenes. Granting access is the opt-in.
>
> Database Settings as an admin destination for people goes away entirely. The rules table goes away.

---

## Act 2 — Admin invites (~2min)

**Screen:** **Invite sheet** → **Team list**

**Say:**

> Same entry point: Team → Invite members. But the sheet now handles temporary access end-to-end.
>
> [Walk through fields top to bottom]
>
> - Email
> - Access type: External collaborator
> - Project scope: one project
> - Access duration: one hour — always visible
> - Database connection: postgres role
> - Advanced collapsed: IP restrictions for Team+
>
> Send invite. Done. One sheet. No second trip to Database Settings.
>
> [Switch to Team list]
> The member list is the source of truth. External collaborator badge. Active · 47 minutes left. Edit, extend, revoke in one click.

---

## Act 3 — Invitee accepts (~2min)

**Screen:** **Join & onboarding** → **My access (active)**

**Say:**

> Invitee gets an email, hits the join link, signs in or creates an account. Email must match.
>
> [Onboarding screen]
> We auto-generate a scoped access token—they never hunt Account Settings. Connection strings for direct Postgres and the pooler. Copy into psql or their IDE.
>
> This is not one-and-done. [My access]
> My access is persistent. Countdown, regenerate token, connection strings always here.
>
> External collaborators may never need full Studio. My access is their dashboard.

---

## Act 4 — Member connects (~1min)

**Screen:** **Connect sheet**

**Say:**

> What about an existing project member with temporary elevated Postgres access? They find it in Connect, Direct connection. Role picker if they have multiple grants. Token pre-filled or one click to generate.

---

## Act 5 — Expiry (~45s)

**Screen:** **Team list (expired)** → **My access (expired)**

**Say:**

> When the hour is up, access stops. Postgres rejects the connection even if the token is still valid. Admin sees Expired on the member row. Contractor sees it in My access. No silent failure.

---

## Act 6 — Close (~30s)

**Screen:** **Vision** tab or PR-FAQ summary

**Say:**

> Recap:
>
> 1. Temporary access lives in Team, not Database Settings.
> 2. Auto-enable on first grant—no separate toggle.
> 3. External collaborators are org guests with a connection-first experience.
> 4. Scoped PATs auto-minted at onboarding; My access is persistent.
> 5. Core security on all tiers; custom templates on Enterprise.
>
> Backend JIT work stays. We're unifying admin and member experience around access grants.
>
> Next: align with Etienne, Kamal on scoped PATs, and Custom Permissions for Enterprise templates.

---

## Post-recording

- [ ] Upload to design team channel / Linear SEC-888
- [ ] Schedule stakeholder review ([STAKEHOLDER-REVIEW.md](./STAKEHOLDER-REVIEW.md))
- [ ] Log feedback in stakeholder review feedback table
