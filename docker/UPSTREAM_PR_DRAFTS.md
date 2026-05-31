# Upstream PR drafts for JWT verifier stabilization

These are ready-to-paste pull-request descriptions for the service repositories whose source is not in `supabase/supabase`. Each PR implements the `VerifyJWT v1` contract from `docker/JWT_VERIFIER_ARCHITECTURE.md`.

The contract is the source of truth; these drafts describe how each language/runtime hosts it.

---

## PR 1 — `supabase/storage-api`: JWKS hot-reload, fail-closed verifier, structured observability

### Summary

Replaces Storage's startup-only static JWKS loader with a refresh-aware verifier that:

1. Honors a remote JWKS URL (defaulting to `http://auth:9999/.well-known/jwks.json`) with ETag-aware periodic refresh.
2. Forces a JWKS refresh when a token's `kid` is unknown (rate-limited).
3. **Fails closed**: a verification error returns HTTP 401 and never produces an anonymous Postgres session.
4. Emits structured logs and Prometheus metrics: `jwt_verify_total`, `jwt_verify_failure_total{reason}`, `jwks_refresh_success_total`, `jwks_refresh_failure_total`, `jwks_cache_age_seconds`.
5. Retains the existing static `JWT_JWKS` env path as an initial cache and offline fallback.

### Problem

Closes the Storage half of:

- supabase/supabase#46303 — Storage & Realtime return null `auth.uid()` in RLS after HS256→ES256 migration
- supabase/supabase#42037 — invalid JWT: signing method HS256 is invalid (HS256↔ES256 mismatch)

Before this PR, the verifier loaded keys exclusively from `JWT_JWKS` at process start. After a hosted key rotation, the pod fleet retained its initial JWKS until the next deployment; until then ES256 tokens whose `kid` was not in the startup JWKS produced verification failures, which the existing middleware translated into an empty `request.jwt.claims` GUC — i.e. an anonymous role with `auth.uid() = null`. This silently broke any RLS policy keyed on `auth.uid()`.

### Behavior changes (user-visible)

- ES256 tokens whose `kid` was added to the project's JWKS after pod start now validate within `JWKS_REFRESH_INTERVAL` (default 60 s), or immediately on the next request that presents the new `kid`.
- An invalid JWT now returns 401. It no longer falls through to anon. _If you have policies that allowed anon, they continue to apply to requests without an `Authorization` header — only **invalid** Authorization is rejected._
- New env knobs: `JWT_JWKS_URL`, `JWKS_REFRESH_INTERVAL`, `JWKS_REFRESH_MIN_INTERVAL`, `JWKS_REFRESH_TIMEOUT`.

### Implementation notes

- Use `jose.createRemoteJWKSet` with a custom `cacheMaxAge` + manual `reload()` triggered on `JWTInvalid: ERR_JWKS_NO_MATCHING_KEY`.
- Wrap the verifier in a small state machine that:
  - keeps the previous JWKS while a refresh is in flight,
  - refuses to swap in an empty key set,
  - bounds the unknown-kid forced refresh at one per `JWKS_REFRESH_MIN_INTERVAL`.
- HS256 fallback gated on `header.alg === 'HS256' && process.env.AUTH_JWT_SECRET`.

### Test plan

- New unit suite covering: known-kid OK, unknown-kid → refresh → OK, unknown-kid → refresh-empty → 401, refresh failure → keep previous JWKS, tampered signature → 401, alg/kid mismatch → 401, HS256 fallback OK.
- Existing E2E suite in `supabase/supabase` (`docker/tests/test-jwt-e2e.sh`) MUST pass when Storage is built from this branch.

### Rollback

Setting `JWT_JWKS_URL=` (empty) reverts to the previous static-JWKS-only behavior. The static path is unchanged.

---

## PR 2 — `supabase/realtime`: JWKS GenServer, reconnect re-verification, fail-closed

### Summary

Adds `Realtime.JwtVerifier` GenServer that owns the JWKS cache for each tenant, fetches it via `Tesla` against `auth/.well-known/jwks.json`, and refreshes on a timer + on unknown-kid. The Phoenix socket auth pipeline (`Realtime.Channels.Auth`) and the broadcast REST endpoint both consume it.

### Problem

Closes the Realtime half of:

- supabase/supabase#46303 — `auth.uid()` is null in Realtime channel authorization RLS

In the current code path, `API_JWT_JWKS` is parsed once at boot. A token whose `kid` was added later (key rotation) is rejected with a generic 401 at WS upgrade time. RLS policies on `realtime.messages` keyed on `auth.uid()` see a null UID for any reconnect that arrived with a fresh ES256 token. This breaks channel subscriptions for the user's own data.

### Behavior changes

- WebSocket reconnects RE-verify the access token rather than trusting the previous socket's identity context.
- A `phx_join` payload carrying a token with an unknown `kid` triggers a one-shot refresh of the tenant's JWKS before deciding to reject.
- New Telemetry events: `[:realtime, :jwt, :verify, :start | :stop | :exception]`, `[:realtime, :jwks, :refresh, :start | :stop]`.

### Implementation notes

- `Realtime.JwtVerifier` is supervised under `Realtime.Tenants.JwtSupervisor` so each tenant has an independent cache.
- ETS-backed cache, replaced atomically via `:ets.insert`.
- Backpressure: `JWKS_REFRESH_MIN_INTERVAL` (default `:timer.seconds(10)`) prevents unknown-kid spam from overwhelming Auth.
- Token's `kid` is normalized; unknown-kid for HS256 tokens (no kid) falls through to `API_JWT_SECRET` legacy path.

### Test plan

- ExUnit suite under `test/realtime/jwt_verifier_test.exs` covering the same matrix as PR 1.
- Integration test using a live Auth + Realtime pair: rotate signing key, observe that an ES256 token with the new kid joins within `JWKS_REFRESH_INTERVAL`.
- `docker/tests/test-jwt-e2e.sh` Realtime section MUST pass.

### Rollback

Revert by setting `JWT_JWKS_URL=` empty; the loader falls back to the previous `API_JWT_JWKS`-only behavior.

---

## PR 3 — `supabase/auth`: strict `key_ops` enforcement and JWKS publish hygiene

### Summary

Tightens the signing-key selection and JWKS publication code paths so that:

1. A key with `key_ops` lacking `"sign"` is NEVER used to mint new JWTs.
2. A key with `key_ops` lacking `"verify"` is NEVER used to verify incoming JWTs.
3. The `/.well-known/jwks.json` response MUST omit any private-key material (`d` for EC, `k` for `oct`, RSA private fields). This is enforced by an explicit filter, not by upstream library behavior.
4. Auth exposes a `jwks_etag` header and a `Last-Modified` header on `/.well-known/jwks.json` to enable downstream conditional fetches.

### Problem

The current implementation does the right thing in the common case but relies on operator hygiene to keep private keys out of the published JWKS. The verifier services need stable JWKS HTTP caching primitives to implement the contract.

### Behavior changes

- The JWKS endpoint now sets `ETag` and `Last-Modified`. Existing `Cache-Control` semantics unchanged.
- A misconfigured `GOTRUE_JWT_KEYS` containing a key with only `"verify"` ops will REFUSE to boot rather than silently using it for signing.

### Test plan

- Unit tests in `internal/api/well_known_test.go`.
- Fuzz the published JWKS body for any key containing `"d"`, `"p"`, `"q"`, `"dp"`, `"dq"`, `"qi"`, or `"k"` — assert never present.

### Rollback

Revert is purely additive; downgrade picks up no behavior change.

---

## PR 4 — `supabase/edge-runtime` / `docker/volumes/functions/main/index.ts`: align Edge Functions JWT verifier with the contract

### Summary

The main shim already uses `jose.createRemoteJWKSet`. This PR:

1. Adds explicit fail-closed handling (current code already 401s on `isValidJWT === false`; this PR adds structured logging and replaces ad-hoc `console.error` with a leveled logger).
2. Adds the same metrics as the Node verifier in Storage.
3. Removes the recommendation in `apps/docs/content/guides/functions/auth.mdx` to deploy with `--no-verify-jwt` for ES256 (closes #42244 properly).

### Problem

Closes supabase/supabase#42244. Edge Functions ES256 support exists but was undocumented as production-ready; the documented workaround (`--no-verify-jwt`) defeats platform-level auth.

### Behavior changes

- Edge Function deployments using ES256 are first-class supported, no `--no-verify-jwt` required.
- Docs updated to reflect supported state.

### Test plan

- A new e2e covering: deploy a function with `verify_jwt: true`, call it with a fresh ES256 user JWT, expect 200; call with tampered token, expect 401.

---

## Cross-cutting CI

All four PRs are gated by the `docker/tests/test-jwt-e2e.sh` and `docker/tests/test-jwt-rotation.sh` scripts in this repo, run against a stack built from the PR's image. A green run produces:

```
=== test-jwt-e2e: NN passed, 0 failed ===
=== test-jwt-rotation: MM passed, 0 failed ===
```

The CI job lives in `.github/workflows/jwt-e2e.yml` (added in a follow-up infra PR) and runs nightly + on every PR touching `docker/`, `supabase/auth`, `supabase/storage-api`, `supabase/realtime`, or `supabase/edge-runtime`.

---

## Migration & rollback (cross-PR)

| Step | Operator action | Failure mode | Recovery |
| ---- | --------------- | ------------ | -------- |
| 1    | Pull new images with the contract | Old behavior preserved if `JWT_JWKS_URL` not set | Set `JWT_JWKS_URL=` to disable URL fetch |
| 2    | Set `JWT_JWKS_URL` for Storage/Realtime/Edge | URL unreachable | Verifier keeps static `JWT_JWKS` as fallback |
| 3    | Rotate signing key in Auth | New `kid` not picked up within `JWKS_REFRESH_INTERVAL` | Force refresh by restarting a single pod; inspect `jwks_cache_age_seconds` |
| 4    | Decommission old `kid` | Old tokens 401 | Operator-controlled; tied to `JWT_EXPIRY` budget |

Each PR is independently reversible by image rollback. No state changes are persistent.
