# Temporary access — stakeholder review

**Purpose:** Alignment session for unified temporary access in production Studio  
**Docs:** [README](./README.md) · [PR-FAQ](./PR-FAQ.md) · [Tier matrix](./TIER-MATRIX.md) · [Product decisions](./PRODUCT-DECISIONS.md)

**Demo path (feature preview on):** Organization → Team → Invite members (External collaborator) → accept join flow → Account → My access → project Connect sheet (Direct tab).

There is **no sandbox route**. All UI lives in production Studio behind the `jitDbAccess` feature preview.

---

## Attendees

| Name             | Area                   | Focus                                   |
| ---------------- | ---------------------- | --------------------------------------- |
| Etienne Stalmans | Security / JIT backend | PAM auto-enable, grant model, API shape |
| Kamal            | Scoped access tokens   | Auto-mint PAT, permission intersection  |
| Johnny           | Scoped access          | Alignment with broader access work      |
| Danny White      | Product Design         | Studio integration, docs                |

---

## Decisions (Studio status)

| Decision                                               | Studio                                                  |
| ------------------------------------------------------ | ------------------------------------------------------- |
| Admin UX in **Org → Team** (not Database Settings)     | Shipped                                                 |
| **Auto-enable PAM on first grant** — no admin toggle   | Shipped (client-side hook)                              |
| **External collaborator** = org guest, visible in Team | Shipped                                                 |
| **Expiry** configurable at invite / manage time        | Shipped (UI)                                            |
| **My access** hub                                      | Shipped (`/account/access`)                             |
| **Scoped PAT auto-mint** at onboarding                 | Not shipped — links to token creation                   |
| **pending_access_grant** on invitation API             | Not shipped — UI builds payload, mutation does not send |
| Database Settings JIT rules UI                         | Removed                                                 |

---

## API gaps

### P0 — unblock full guest invite + member experience

| Change                                                            | Purpose                              | Owner               | Studio                  |
| ----------------------------------------------------------------- | ------------------------------------ | ------------------- | ----------------------- |
| Extend `POST .../members/invitations` with `pending_access_grant` | Apply JIT grant on accept            | Platform API        | Payload ready; not sent |
| Apply grant + auto-enable PAM on accept                           | Server-side first-grant enable       | Security / Mgmt API | Client hook only today  |
| Auto-mint scoped PAT on accept                                    | Onboarding without manual token step | Auth / Kamal        | Interstitial only       |
| `GET /platform/profile/access-grants`                             | Cross-project list for My access     | Platform API        | N+1 workaround          |

### P1 — lifecycle

| Change                         | Purpose                                                   |
| ------------------------------ | --------------------------------------------------------- |
| Extend member update mutations | Extend / revoke / edit grants from Team                   |
| Team list refresh on revoke    | SEC-463 cascade visibility                                |
| Audit log events               | `access_grant.created`, `.expired`, `.revoked`            |
| Server-side tier enforcement   | Match UI gates for IP, project scope, multi-project guest |

### Reuse (no change)

| Endpoint                                     | Use                                         |
| -------------------------------------------- | ------------------------------------------- |
| `GET/PUT /v1/projects/{ref}/jit-access`      | Enable/disable PAM                          |
| `PUT/DELETE /v1/projects/{ref}/database/jit` | Postgres role grants per user               |
| `GET /v1/projects/{ref}/database/jit`        | Self-query (Connect, My access per project) |

---

## Review agenda (45 min)

1. **Problem + vision** (5 min) — [PR-FAQ](./PR-FAQ.md) press release
2. **Live Studio walkthrough** (15 min) — Team invite → Manage database access → My access → Connect
3. **API gaps** (10 min) — table above; assign owners
4. **Tier matrix** (5 min) — [TIER-MATRIX.md](./TIER-MATRIX.md)
5. **Custom Permissions coupling** (5 min) — Enterprise later; don't block P0
6. **Next steps** (5 min) — invitation API + profile access-grants endpoint

---

## Feedback log

| Reviewer | Date | Feedback | Action |
| -------- | ---- | -------- | ------ |
| Etienne  |      |          |        |
| Kamal    |      |          |        |
| Johnny   |      |          |        |

---

## Linear links

- [SEC-888 — UI/UX changes](https://linear.app/supabase/issue/SEC-888/ui-ux-changes)
- [PAM for Just-In-Time Database Access](https://linear.app/supabase/project/pam-for-just-in-time-database-access/overview)
- [Custom Permissions - Platform](https://linear.app/supabase/project/custom-permissions-platform-713a2641de72)
