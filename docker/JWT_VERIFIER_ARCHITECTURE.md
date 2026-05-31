# Supabase JWT Verifier Architecture

**Status:** Proposal
**Owners:** Auth / PostgREST / Storage / Realtime / Edge Runtime
**Related issues:** [#42037](https://github.com/supabase/supabase/issues/42037), [#42244](https://github.com/supabase/supabase/issues/42244), [#46303](https://github.com/supabase/supabase/issues/46303)

This document defines a single contract that every Supabase service which validates user JWTs MUST conform to. The goal is to eliminate the class of bugs where one service (PostgREST) validates an ES256 token correctly while another (Storage, Realtime, Edge Functions) silently falls back to HS256-only, accepts the connection anonymously, and lets RLS deny user requests with `auth.uid() = null`.

---

## 1. Problem statement

After the HS256 → ES256 migration, the user-facing failure is asymmetric:

| Service        | Validates ES256? | RLS context             |
| -------------- | ---------------- | ----------------------- |
| PostgREST      | yes              | `auth.uid()` = user.id |
| Storage        | no               | `auth.uid()` = null    |
| Realtime       | no               | `auth.uid()` = null    |
| Edge Functions | partially        | varies                 |

The root cause has two layers:

1. **Configuration drift** (self-hosted): the asymmetric-key envvars (`JWT_JWKS`, `API_JWT_JWKS`, `GOTRUE_JWT_KEYS`) are not wired identically across services. _Fixed declaratively in this repo._
2. **Verifier code divergence** (every deployment): each service implements JWKS handling differently — different libraries, cache TTLs, refresh policies, and failure modes. _Requires upstream service patches per the contract below._

---

## 2. The contract (`VerifyJWT v1`)

Every JWT verifier in the Supabase platform MUST implement the operations below.

### 2.1 Inputs

| Input            | Description                                                                            |
| ---------------- | -------------------------------------------------------------------------------------- |
| `token`          | The compact JWS string from the `Authorization: Bearer` header                         |
| `now`            | Current time (monotonic, injected for testability)                                     |
| `keySource`      | Either a static JWKS (`JWT_JWKS` env) or a JWKS URL (`auth/.well-known/jwks.json`)     |
| `legacySecret`   | Optional HS256 fallback symmetric secret (`JWT_SECRET` / `AUTH_JWT_SECRET`)            |
| `requiredClaims` | `aud`, `iss`, `exp`, `nbf`, `iat` validation policy                                    |

### 2.2 Algorithm

```
verify(token):
  header = decode_header(token)
  if header.alg not in {HS256, ES256, RS256, EdDSA}:
    return Err(UnsupportedAlg)

  if header.alg == HS256:
    key = legacySecret
    if key is None: return Err(NoLegacyKey)
  else:
    key = jwks.resolve(header.kid)
    if key is None:
      jwks.refresh_now()                # one immediate refresh, rate-limited
      key = jwks.resolve(header.kid)
      if key is None:
        return Err(UnknownKid, header.kid)
    if key.alg != header.alg:
      return Err(AlgKidMismatch)
    if "verify" not in (key.key_ops or ["verify"]):
      return Err(KeyOpsMismatch)

  payload = verify_signature(token, key)
  if payload is None: return Err(BadSignature)
  validate_claims(payload, now, requiredClaims)
  return Ok(payload)
```

### 2.3 Failure mode: **fail-closed**

A failed verification MUST result in **HTTP 401** (or the equivalent protocol-level reject) and MUST NOT:

- proceed as the `anon` role
- proceed with `request.jwt.claims` cleared
- proceed with `auth.uid() = null` while preserving an `authenticated` role label
- silently retry on alternate keys without bounded retry budget

Specifically: the path "missing/invalid Authorization → anon role" is allowed; the path "**invalid** Authorization → anon role" is FORBIDDEN. They look identical to RLS, which is precisely why this bug class causes silent data-access failures with no log.

### 2.4 JWKS cache lifecycle

| Event              | Behavior                                                                              |
| ------------------ | ------------------------------------------------------------------------------------- |
| Startup            | Fetch once; if static `JWT_JWKS` provided, use it as the initial cache                |
| Periodic           | Refresh every `JWKS_REFRESH_INTERVAL` (default 60 s); ETag/`If-Modified-Since` aware |
| Unknown `kid`      | Immediate refresh, max once per `JWKS_REFRESH_MIN_INTERVAL` (default 10 s)            |
| Refresh failure    | Keep last-good JWKS, log `jwks.refresh_failure`, increment `jwks_refresh_failure_total` |
| Empty JWKS         | Keep last-good JWKS; refuse to swap to an empty set                                   |

### 2.5 Observability (required)

Each service MUST emit:

**Structured log lines:**

```
jwt.verify.start    service=storage  kid=abc123  alg=ES256
jwt.verify.success  service=storage  kid=abc123  sub=<uuid>  role=authenticated
jwt.verify.failure  service=storage  kid=abc123  reason=unknown_kid
jwks.refresh.start  service=storage  url=http://auth:9999/.well-known/jwks.json
jwks.refresh.ok     service=storage  keys=2  etag=W/"..."
jwks.refresh.fail   service=storage  reason=timeout
```

**Metrics (Prometheus):**

| Metric                                                   | Labels                    |
| -------------------------------------------------------- | ------------------------- |
| `jwt_verify_total`                                       | `service`, `alg`, `kid`   |
| `jwt_verify_failure_total`                               | `service`, `alg`, `reason` |
| `jwks_refresh_success_total`                             | `service`                  |
| `jwks_refresh_failure_total`                             | `service`, `reason`        |
| `jwks_cache_size`                                        | `service`                  |
| `jwks_cache_age_seconds` (gauge: now − last refresh ok) | `service`                  |

A platform alert MUST fire when `jwt_verify_failure_total{reason="unknown_kid"}` spikes — that is the canary for a rotated key that did not propagate.

### 2.6 Configuration surface (envvars)

| Variable                       | Type    | Purpose                                                                                   |
| ------------------------------ | ------- | ----------------------------------------------------------------------------------------- |
| `JWT_JWKS` / `API_JWT_JWKS`    | JWKS    | Static JWKS; used as initial cache + fallback if URL unreachable                          |
| `JWT_JWKS_URL`                 | URL     | Authoritative JWKS URL (typically `http://auth:9999/.well-known/jwks.json`)               |
| `JWT_LEGACY_SECRET` / `AUTH_JWT_SECRET` | string | HS256 fallback secret for legacy tokens                                            |
| `JWT_AUDIENCE`                 | string  | Required `aud` value (default `authenticated`)                                            |
| `JWT_ISSUER`                   | string  | Required `iss` value                                                                      |
| `JWKS_REFRESH_INTERVAL`        | seconds | Periodic refresh; default `60`                                                            |
| `JWKS_REFRESH_MIN_INTERVAL`    | seconds | Floor between unknown-kid forced refreshes; default `10`                                  |
| `JWKS_REFRESH_TIMEOUT`         | seconds | Per-refresh HTTP timeout; default `5`                                                     |

---

## 3. Implementation map per service

### 3.1 `supabase/storage-api` (Node/TS)

- Library: `jose` (already used).
- Replace the current static `JWT_JWKS`-only verifier with a `createRemoteJWKSet`-equivalent that respects ETag, supports forced refresh on unknown-kid, and falls back to the env-provided static JWKS when the URL is unreachable.
- Wire HS256 fallback via a tagged union `KeyResolver = { type: 'jwks'; jwks } | { type: 'symmetric'; secret }` selected by the header alg.
- Emit structured logs and Prometheus metrics through the existing logger/metrics modules.

### 3.2 `supabase/realtime` (Elixir/Phoenix)

- Library: `joken` + `JOSE` (already used).
- Add a `Realtime.JwtVerifier` GenServer holding the JWKS cache, with `:timer` periodic refresh and a `refresh_now/0` API used by `Realtime.Channels.Auth` on unknown-kid.
- On WebSocket reconnect, RE-verify the token: never trust the prior socket's auth context.
- Surface metrics via Telemetry.

### 3.3 `supabase/auth` (GoTrue, Go)

- Already supports `GOTRUE_JWT_KEYS` for signing/verification.
- Required changes:
  - Enforce `key_ops` strictly (a `"verify"`-only key MUST NOT sign).
  - Publish `key_ops`-filtered JWKS on `/.well-known/jwks.json` (private `d` field MUST never leak).
  - Add metrics for signing-key selection and JWKS publish age.

### 3.4 `supabase/edge-runtime` (Rust + Deno)

- The main shim in `docker/volumes/functions/main/index.ts` uses `jose.createRemoteJWKSet` already; adopt the same fail-closed + refresh-on-unknown-kid policy.
- Edge Functions should NOT require `--no-verify-jwt` to work with ES256; the workaround documented in #42244 becomes obsolete once the contract is met.

### 3.5 `postgrest/postgrest`

- PostgREST already supports JWKS verification via `PGRST_JWT_SECRET`.
- No code change required, but configuration must be a JWKS object (or URL once PostgREST adds URL support); current self-hosted compose feeds `${JWT_JWKS:-${JWT_SECRET}}`.

---

## 4. RLS context injection

For Postgres-backed services (PostgREST, Storage, Realtime via authorization on `realtime.messages`), the verified claims MUST be injected via a `SET LOCAL` transaction-scoped GUC:

```sql
set local request.jwt.claims = '<verified-claims-json>';
set local role = '<role-from-claims>';
```

This MUST happen AFTER a successful verification and MUST NOT happen on verification failure. Storage and Realtime currently establish their own connections; both must follow the same injection convention as PostgREST so that `auth.uid()`, `auth.role()`, and `auth.jwt()` resolve consistently from any service's request context.

---

## 5. Backward compatibility

- HS256 tokens continue to validate as long as `legacySecret` is configured. The legacy `oct` JWK that this repo's `add-new-auth-keys.sh` writes into `JWT_JWKS` (alongside the EC key) preserves HS256 acceptance during the migration window.
- Removing HS256 support is gated by an explicit `JWT_DISABLE_HS256=true` flag and a deprecation cycle.

---

## 6. Security analysis

| Threat                                | Mitigation                                                                                  |
| ------------------------------------- | ------------------------------------------------------------------------------------------- |
| Algorithm confusion (HS256 with EC pub key) | `header.alg` is matched to the resolved key's `kty`/`alg` BEFORE verification           |
| Key downgrade via unknown-kid spam    | Forced refresh rate-limited by `JWKS_REFRESH_MIN_INTERVAL`                                  |
| Stale-cache acceptance of revoked key | Periodic refresh; explicit `kid` removal from JWKS propagates within `JWKS_REFRESH_INTERVAL` |
| Anonymous downgrade on verify failure | Hard 401, never anon. Tests enforce this (see `test-jwt-e2e.sh` negative cases)             |
| Private key exposure                  | `/.well-known/jwks.json` MUST publish only public keys; `d`/`oct.k` enforced absent          |
| Side-channel via verification timing  | Use constant-time signature verification (provided by `jose`, `joken`)                       |

---

## 7. Rollout & migration

1. **Phase A — Config (this repo):** ship the declarative compose wiring (already merged in this PR series).
2. **Phase B — Verifiers:** ship the contract above in `storage-api`, `realtime`, `edge-runtime`. Auth ships strict `key_ops` enforcement.
3. **Phase C — Observability:** dashboards on `jwt_verify_failure_total` and `jwks_cache_age_seconds`. Alert thresholds.
4. **Phase D — Sunset HS256:** offer `JWT_DISABLE_HS256` opt-in, then default-on after one release cycle with a fleet-wide audit.

Each phase is independently shippable and reversible.
