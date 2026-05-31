# JWT Verifier Behavior: Hosted vs Self-Hosted

This document explains why the reported failure mode (`auth.uid()` becomes `null` in Storage / Realtime after migrating to ES256 signing keys) can manifest in **both** hosted Supabase and the self-hosted Docker bundle, and what is fixed by the self-hosted compose patch versus what requires upstream service patches.

It exists because the original bug report ([#46303](https://github.com/supabase/supabase/issues/46303)) was filed against the **hosted** platform, and the compose fix in this repo cannot, by itself, explain a hosted failure.

---

## 1. The four planes that have to agree

For an ES256 user JWT to authenticate end-to-end, four pieces of state must reference the same active key set:

| Plane                  | Question                                                                                  |
| ---------------------- | ----------------------------------------------------------------------------------------- |
| **Signer**             | Which key does Auth use to sign session tokens it returns from `/auth/v1/token`?         |
| **Published JWKS**     | Which keys does `/auth/v1/.well-known/jwks.json` advertise?                              |
| **Verifier inputs**    | Which keys do Storage / Realtime / PostgREST / Edge Functions actually load on startup?  |
| **Verifier cache**     | Do those services re-read JWKS at runtime, and does an unknown `kid` trigger a refresh? |

A failure on any plane produces a different observable symptom. The symptom in #46303 — same token works in PostgREST, not in Storage/Realtime — implicates **plane 3 or plane 4** divergence between services.

---

## 2. Self-hosted: where it breaks here

In `docker/docker-compose.yml` (before this PR series):

- Plane 1 (Auth signer): controlled by `GOTRUE_JWT_KEYS`, commented out by default.
- Plane 2 (Published JWKS): Auth derives the public set from `GOTRUE_JWT_KEYS`.
- Plane 3 (Verifier inputs):
  - PostgREST: `PGRST_JWT_SECRET: ${JWT_JWKS:-${JWT_SECRET}}` — **already active**.
  - Storage: `JWT_JWKS` — **commented out**.
  - Realtime: `API_JWT_JWKS` — **commented out**.
- Plane 4 (Verifier cache): Storage and Realtime read the env-supplied JWKS once at startup; they do not re-fetch from a URL.

**Resulting failure:** if `add-new-auth-keys.sh` succeeds (writes `.env`) but its post-write `sed` over `docker-compose.yml` fails or is reverted (custom compose file, stack-redeploy without rerunning the script, etc.), PostgREST adopts the JWKS via the `:-...` fallback but Storage and Realtime do not. The symptom is exactly #46303.

**Fixed by:** the compose patch in this PR set (commented-out lines made declarative defaults). Verified by `docker/tests/test-auth-keys.sh` config-presence checks and `docker/utils/diagnose-jwt.sh` runtime probe.

---

## 3. Hosted: why it can still manifest

The hosted platform does not use this repo's Docker bundle. Its deployment pipeline is closed-source, so the analysis below is from publicly observable behavior and from the existing documented constraints:

1. The third-party-auth integration documentation states: _"The JWT signing keys from the third-party provider are stored in the configuration of your project, and are checked for changes periodically. If you are rotating your keys (when supported) allow up to 30 minutes for the change to be picked up."_ (`apps/docs/content/guides/auth/third-party/overview.mdx`). This implies a **per-service local JWKS cache** with a refresh window measured in tens of minutes.
2. Hosted Storage and Realtime are deployed as separate fleets behind the project router and connect to Postgres independently of PostgREST.
3. Hosted rolling deploys can transiently produce a fleet split-brain where a fraction of pods have the new JWKS and another fraction have the previous one.

Combining (1) + (2) + (3), the hosted analogue of the self-hosted bug is:

> Storage and Realtime pod fleets pick up the rotated JWKS on a separate refresh schedule from PostgREST. During the window after the operator rotates to ES256, PostgREST may already trust the new `kid` while a Storage/Realtime pod still holds an empty or stale JWKS — producing identical user-facing symptoms.

This is consistent with #46303's report that the failure persisted long enough to be reproducible and was not transient.

---

## 4. Reproducibility matrix

| Environment        | Plane that breaks                              | Repro likelihood                                                                                  | Fixed by                                                                |
| ------------------ | ---------------------------------------------- | -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| **Self-hosted**    | Plane 3 — Storage/Realtime missing `JWT_JWKS` | Deterministic if the rotation script failed to uncomment compose lines, or if the operator hand-rolled compose. | This PR (declarative compose wiring + tests).                            |
| **Self-hosted**    | Plane 4 — env-time-only JWKS, no runtime refresh | Manifests on every key rotation until containers are recreated.                                    | Phase B verifier contract (architecture doc §3).                          |
| **Hosted**         | Plane 3 — per-fleet JWKS deploy lag           | Manifests transiently during rotation; can persist on a single pod if its initial fetch failed.    | Phase B verifier contract + Phase C observability + Phase D hosted rollout. |
| **Hosted**         | Plane 4 — JWKS cache TTL too long             | Manifests as a 30-min-or-more window where some services trust the new `kid` and others don't.    | Phase B (cache TTL & unknown-kid refresh).                                |
| **Both**           | Plane 1 ↔ Plane 2 disagreement                | Rare; would indicate a bug in Auth.                                                                | Auth-side strict `key_ops` enforcement (architecture doc §3.3).           |

---

## 5. What to tell hosted users today (mitigations)

These are operator workarounds, not fixes. The fix is the upstream verifier contract.

1. After rotating to ES256, wait at least the documented refresh window (up to 30 min) before considering a verifier consistent.
2. Use `auth.getClaims()` (which goes through the JWKS-aware path) rather than legacy validators.
3. If `auth.uid()` resolves in PostgREST but not in Storage/Realtime for the same JWT, the JWT itself is fine — escalate to support so the affected pod(s) can be cycled or have their JWKS cache forced to refresh. Do NOT rotate again; rotation does not fix a stale cache, it just changes the active key while the stale verifier still won't know about it.
4. Validate the asymmetric state with the diagnostic script (`docker/utils/diagnose-jwt.sh`) against the hosted REST endpoint and a captured session token — it does not require docker access to the hosted infra, only the public REST + the user's session JWT. (Run with `--base-url https://<ref>.supabase.co`.)

---

## 6. Why this analysis is bounded

The hosted platform's deployment topology, JWKS distribution mechanism, and per-service refresh schedule are not in this repository. Everything in §3 is inferred from public docs (`apps/docs/`), the externally observed behavior in #46303, and the same architectural patterns reflected in the Docker bundle. The proposed upstream PRs (see `docker/UPSTREAM_PR_DRAFTS.md`) are the path by which both planes converge on the same contract regardless of where the services run.
