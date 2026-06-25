# Temporary access vision — stakeholder review

**Purpose:** Alignment session for unified temporary access UX  
**Prototype:** `/design-prototypes/temporary-access` in Studio (local dev)  
**Docs:** [PR-FAQ](./PR-FAQ.md) · [Tier matrix](./TIER-MATRIX.md) · [Product decisions](./PRODUCT-DECISIONS.md) · [Video guide](./VIDEO-WALKTHROUGH.md)

---

## Attendees

| Name             | Area                   | Focus                                   |
| ---------------- | ---------------------- | --------------------------------------- |
| Etienne Stalmans | Security / JIT backend | PAM auto-enable, grant model, API shape |
| Kamal            | Scoped access tokens   | Auto-mint PAT, permission intersection  |
| Johnny           | Scoped access          | Alignment with broader access work      |
| Danny White      | Product Design         | Prototype, video, PR/FAQ                |

---

## Decisions to confirm

- [ ] Temporary access admin UX lives in **Org → Team** (not Database Settings)
- [ ] **Auto-enable PAM on first grant** — no project toggle in admin flow
- [ ] **External collaborator** = org guest, visible in Team
- [ ] **Default expiry 1 hour** for temp access types (visible, not in Advanced)
- [ ] **Scoped PAT auto-mint** at invite onboarding
- [ ] **My access** hub for persistent connection info
- [ ] Pause fragmented SEC-888 fixes pending this direction

---

## API gaps to capture

### Required for prototype → production

| Endpoint / change                                                | Purpose                                                                                          | Owner               | Priority              |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------- | --------------------- |
| `GET /platform/profile/access-grants`                            | List user's grants across all projects without `project_ref`                                     | Platform API        | P0 — powers My access |
| Extend `POST /platform/organizations/{slug}/members/invitations` | Payload: `access_type`, `expires_at`, `postgres_roles`, `allowed_networks`, `branches_only`      | Platform API        | P0                    |
| Extend member role update mutations                              | Same grant fields for edit/extend/revoke                                                         | Platform API        | P0                    |
| Auto-enable on grant creation                                    | Server-side call to `PUT /v1/projects/{ref}/jit-access` when first DB grant on project           | Security / Mgmt API | P0                    |
| Auto-mint scoped PAT on invite accept                            | Scoped token with grant-bounded permissions                                                      | Auth / Kamal        | P0                    |
| Cascade revoke UI refresh                                        | [SEC-463](https://linear.app/supabase/issue/SEC-463) done; ensure Team list reflects immediately | Studio              | P1                    |

### Existing APIs to reuse (no change)

| Endpoint                                     | Use                                                      |
| -------------------------------------------- | -------------------------------------------------------- |
| `GET/PUT /v1/projects/{ref}/jit-access`      | Enable/disable PAM (auto-called on first grant)          |
| `PUT/DELETE /v1/projects/{ref}/database/jit` | Store postgres role grants per user                      |
| `GET /v1/projects/{ref}/database/jit`        | Member self-query (Connect sheet, My access per-project) |
| `GET /v1/projects/{ref}/database/jit/list`   | Admin list (replaced by Team member grant view)          |

### Future (not blocking Phase 1–2)

| Endpoint / change                     | Purpose                                                     |
| ------------------------------------- | ----------------------------------------------------------- |
| Expiry notification webhooks / emails | T-15min warning, on-expiry                                  |
| `POST .../access-grants/{id}/extend`  | Guest request extension → admin approve                     |
| Audit log events                      | `access_grant.created`, `.expired`, `.revoked`, `.extended` |
| Org-level PAM kill switch             | If Security requires independent of grants                  |

---

## Review agenda (45 min)

1. **Problem + vision** (5 min) — watch or skim [video walkthrough](./VIDEO-WALKTHROUGH.md)
2. **Walk prototype screens** (15 min) — invite → team list → onboarding → My access → Connect
3. **API gaps** (10 min) — table above; assign owners
4. **Tier matrix** (5 min) — [TIER-MATRIX.md](./TIER-MATRIX.md)
5. **Custom Permissions coupling** (5 min) — Enterprise templates later; don't block
6. **Next steps** (5 min) — Phase 1 discovery vs admin unification sequencing

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
