# Assistant review and remediation plan

Reviewed 2026-09-07, at `d83b70d5a5`, against the merge-base with local `master`.
This is a review; no application code or deployed configuration was changed.

## Recommendation

Keep the existing backend as the default. Fix the security findings below before
allowing the worker to access real customer projects, including through a dogfood
cohort. The client flag limits ordinary Studio traffic; it does not restrict direct
worker access or replace consent, identity, and database authorization.

The default route and self-hosted guard are preserved: `generate-v4.ts` and its
TanStack wrapper are unchanged. However, this change also replaces conversation
storage, introduces a second authentication session, changes tool event shapes,
and changes support/feedback behavior. It is more than an endpoint substitution.

Several gaps are acknowledged in `PLAN.md` section 14. This review independently
assesses their impact; deferring consent enforcement is unsafe for real projects.

## Findings

### 1. P1 — Bind OAuth completion to the initiating browser/session

Evidence: [OAuth start and callback](/Users/saxonfletcher/Documents/Repositories/supabase/supabase/apps/assistant/supabase/workers/api/src/http/routes.ts:267).

`/oauth/start` records the caller's assistant `user_id`, an arbitrary `org_slug`,
and the PKCE verifier. `/oauth/callback` is unauthenticated and selects that row
using only the state in the URL. It then stores the resulting OAuth credentials
under the initiating user's ID. Nothing proves that the browser consenting to the
organization is the browser/session that initiated the flow.

An attacker can start a flow under their own assistant account, send its authorize
URL to another person, and have that person's organization authorization attached
to the attacker's account if the person completes consent. Checking the organization
slug does not prevent this: the attacker can supply the intended slug. PKCE does
not fix the missing browser binding because the worker holds the verifier and
redeems the code for whichever browser completes the URL. This is a code-derived
attack path; no real user's OAuth credentials were exercised.

Fix: bind the transaction to an authenticated browser session, verify that binding
before storing tokens, and atomically consume state. An authenticated completion
step can be used if cross-origin cookie constraints prevent a callback session.
Test a valid state opened in another browser/account, absent binding, expired state,
replayed state, and two simultaneous callbacks. Each must fail before token storage.
This follows the browser-binding requirement in [OAuth Security BCP section 2.1.1](https://www.rfc-editor.org/rfc/rfc9700.html#section-2.1.1).

### 2. P1 — Restore all four consent/privacy layers

Evidence: [hardcoded full consent](/Users/saxonfletcher/Documents/Repositories/supabase/supabase/apps/assistant/supabase/workers/api/src/http/routes.ts:561),
[unconditional SQL result forwarding](/Users/saxonfletcher/Documents/Repositories/supabase/supabase/apps/assistant/supabase/workers/api/src/ai/tools/project-tools.ts:68),
and [legacy AI policy resolution](/Users/saxonfletcher/Documents/Repositories/supabase/supabase/apps/studio/lib/ai/ai-details.ts:28).

The worker always supplies `schema_and_log_and_data`, fetches schemas, exposes
read tools without the old consent filter, and returns SQL rows to the model.
An organization configured for disabled/schema-only sharing therefore loses the
old server-side protection. OAuth permission to operate on a project is separate
from permission to send its contents to the model. The existing HIPAA/sensitive
project gate is also absent.

Fix: resolve the verified project/organization relationship and current AI policy
server-side; restore tool filtering, schema-context gating, SQL `toModelOutput`
redaction, and history sanitization. Fail closed when policy cannot be obtained.
Do not accept a client-provided consent level. Test every opt-in level, mismatched
org/project, unknown sensitivity, policy lookup failure, and multi-step SQL results.

### 3. P1 — Enforce parent ownership in message and feedback RLS

Evidence: [messages policy](/Users/saxonfletcher/Documents/Repositories/supabase/supabase/apps/assistant/supabase/schemas/public/tables/messages.sql:18),
[feedback policy](/Users/saxonfletcher/Documents/Repositories/supabase/supabase/apps/assistant/supabase/schemas/public/tables/message_feedback.sql:18),
and [feedback endpoint](/Users/saxonfletcher/Documents/Repositories/supabase/supabase/apps/assistant/supabase/workers/api/src/http/routes.ts:600).

Both policies validate only the child row's `user_id`. Neither proves that the
referenced conversation/message belongs to that user. The foreign keys establish
existence, not authorization; [PostgreSQL foreign-key checks bypass RLS](https://www.postgresql.org/docs/current/ddl-rowsecurity.html).

Verified against the local assistant database using two synthetic users inside one
rolled-back transaction: user A could not select B's conversation, but could insert
an A-owned message into it and feedback on B's message. The victim could not select
the injected message. This demonstrates cross-user integrity failure, not a proven
read leak or model prompt injection. An injected `(conversation_id, id)` can also
occupy a message key that the owner cannot update.

Fix: enforce parent ownership on inserts and updates using relational policies
and/or composite foreign keys including `user_id`; check ownership in the feedback
route too. Test direct Data API operations, not only worker routes. Include row
reparenting, another user's message IDs, soft-deleted parents, and expected denial
for `anon`. Apply equivalent ownership constraints to future sandbox/repository
relationships before those features become writable.

### 4. P1 — Make rollout admission and rollback effective

Evidence: [flag predicate](/Users/saxonfletcher/Documents/Repositories/supabase/supabase/apps/studio/lib/ai/assistant-backend.ts:27),
[worker middleware](/Users/saxonfletcher/Documents/Repositories/supabase/supabase/apps/assistant/supabase/workers/api/src/http/app.ts:19),
and [signup configuration](/Users/saxonfletcher/Documents/Repositories/supabase/supabase/apps/assistant/supabase/config.toml:28).

`NEXT_PUBLIC_ASSISTANT_BACKEND=true` overrides a false feature flag in every
platform environment. If set in a hosted deployment, disabling the remote flag is
not a kill switch. The worker separately accepts any valid assistant user, and
`/auth/exchange` accepts platform JWTs without checking cohort eligibility. The
checked-in project configuration also enables public email signup. CORS does not
prevent a caller outside the cohort from calling the API directly.

Fix: restrict the environment override to local development; add a server-side
dogfood admission/kill switch to exchange and authenticated worker routes; disable
unneeded public signup. Confirm deployed Auth/ingress configuration rather than
assuming local config matches production. Reject advanced model requests unless
entitled: the worker's model allowlist currently includes `gpt-5.3-codex` without
the legacy entitlement/throttle checks. Add bounded request size, duration, and
per-user usage controls for the newly public worker. Lack of rate limiting also
exists in the old implementation; it is not a newly introduced legacy regression.

Rollback needs a lifecycle fix as well: [hydration](/Users/saxonfletcher/Documents/Repositories/supabase/supabase/apps/studio/state/ai-assistant-state.tsx:940)
clears instances only when enabling the backend successfully. If the flag is
disabled and there is no IndexedDB state, the existing cloud chat/transport can
remain active and start being saved locally. Stop in-flight chats, reset instances
and backend-specific state in both directions, and load only the selected store.
On backend load failure, surface an explicit retry state instead of retaining the
previous project's/backend's conversations.

### 5. P1 — Preserve clear/edit/retry history semantics

Evidence: [browser-only message mutations](/Users/saxonfletcher/Documents/Repositories/supabase/supabase/apps/studio/state/ai-assistant-state.tsx:748)
and [upsert then reload of all stored messages](/Users/saxonfletcher/Documents/Repositories/supabase/supabase/apps/assistant/supabase/workers/api/src/http/routes.ts:494).

Clear messages and delete-after-edit remove messages only in Studio. The next send
upserts the remaining messages and reloads every stored row, restoring the removed
context. A reload also brings cleared messages back. The request schema accepts
`trigger` and `messageId`, but the route ignores both, so regeneration cannot remove
the replaced response from server history. The old stateless handler used the
client's edited history directly.

Fix: define explicit server operations for clear, truncate/edit, regenerate, and
approval continuation. Apply a revision/concurrency check so an older tab cannot
overwrite newer history. Keep approvals tied to a stored tool call and exact input,
and prevent duplicate execution on retried approval requests. Verify that cleared
text is absent from both storage and subsequent model context; edited tails and
regenerated responses must stay removed after reload.

### 6. P2 — Bind cached assistant identity to the active Studio identity

Evidence: [cached token fast path](/Users/saxonfletcher/Documents/Repositories/supabase/supabase/apps/studio/lib/ai/assistant-client.ts:124),
[JWT verification](/Users/saxonfletcher/Documents/Repositories/supabase/supabase/apps/assistant/supabase/workers/api/src/platform/platform-jwt.ts:35),
and [session exchange](/Users/saxonfletcher/Documents/Repositories/supabase/supabase/apps/assistant/supabase/workers/api/src/http/routes.ts:190).

The fast path returns a valid assistant token before reading the current platform
session. The persistent `assistant-auth` client has no platform-subject comparison
or auth-change subscription. If a platform session changes or disappears without
the normal local-storage cleanup, the worker continues using the old assistant
identity and its stored OAuth connection. Normal Studio `useSignOut` does clear
non-allowlisted local storage, so this is not a claim that every ordinary logout
leaks the previous account.

Fix: require the active platform identity, compare it with the assistant identity,
clear/revoke the assistant session and user-scoped caches on auth changes, and
single-flight exchanges. Test account switching, expiration, cross-tab auth events,
and concurrent first use. Also verify assurance/session requirements before minting
an assistant session: the current JWT verifier checks signature and optional issuer
but does not enforce audience, MFA assurance, or current platform session status.
The required platform assurance policy needs explicit verification before rollout.

### 7. P2 — Restore tool rendering and reconnect compatibility

Evidence: [explicit MCP schemas](/Users/saxonfletcher/Documents/Repositories/supabase/supabase/apps/assistant/supabase/workers/api/src/ai/tools/mcp-tools.ts:134),
[Studio tool renderer](/Users/saxonfletcher/Documents/Repositories/supabase/supabase/apps/studio/components/ui/AIAssistantPanel/Message.Parts.tsx:338),
[OAuth expiry error](/Users/saxonfletcher/Documents/Repositories/supabase/supabase/apps/assistant/supabase/workers/api/src/db/oauth-connections.ts:123),
and [409 handling](/Users/saxonfletcher/Documents/Repositories/supabase/supabase/apps/studio/state/ai-assistant-state.tsx:400).

The installed AI SDK creates static tools when explicit schemas are supplied. The
old `mcpClient.tools()` creates dynamic tools. Consequently `list_tables`, advisors,
and other MCP tools now emit `tool-<name>` parts which fall through Studio's renderer
to `null`; the old generic dynamic renderer displayed their progress/results.
Normalize MCP tools to the existing event contract or support their static variants.
Restore an explicit harness capability/privacy allowlist and drift checks; the new
SDK schema filter does remove non-listed tools, so this is not a claim that arbitrary
remote write tools currently pass through.

`oauth_expired` is another mismatch: the worker returns it when refresh fails, but
Studio only recognizes `oauth_required`. Treat both as reconnect-required, and open
the popup synchronously from the click before awaiting network requests. Test both
error codes and browser popup behavior.

### 8. P2 — Finish persistence and resource lifecycle handling

Evidence: [MCP cleanup](/Users/saxonfletcher/Documents/Repositories/supabase/supabase/apps/assistant/supabase/workers/api/src/ai/tools/mcp-tools.ts:118),
[normal response close handling](/Users/saxonfletcher/Documents/Repositories/supabase/supabase/apps/assistant/supabase/workers/api/client-disconnect.ts:16),
and [conversation creation](/Users/saxonfletcher/Documents/Repositories/supabase/supabase/apps/studio/state/ai-assistant-state.tsx:305).

The MCP client closes only on abort or setup failure. Successful completion has no
explicit cleanup; the local adapter intentionally does not abort an ended response.
Close it once after stream completion/persistence, cancellation, and errors. Pass
timeouts/abort signals through Management API calls as well.

Support metadata is never written by create/update routes, although reload mapping
expects it; support conversations lose their ticket/lifecycle link after reload.
Branch creation stores lineage but no copied messages until the first send, so
reloading an unsent branch loses its history. Implement and test both persistence
contracts. Creation failures are swallowed and followed by chat sends against a
nonexistent conversation; propagate them with a retryable UI state.

The server also reads messages oldest-first without pagination while local
PostgREST is capped at 1,000 rows. Beyond that cap, the latest message can disappear
from the loaded context. Load a bounded recent window for inference, paginate UI
history, and lazy-load conversation details rather than fetching every chat at once.

## Code quality and comparison with the old implementation

Useful foundations: the worker separates HTTP, database, OAuth, and AI modules;
ordinary CRUD uses the user-scoped Supabase client; Vault calls use parameterized SQL;
private functions set an empty search path, revoke public execution, and grant only
the intended privileged role. Every declared public table has RLS enabled.
OAuth state has no client policy, and connection/identity metadata is read-only to
its owner. I found no public token-decryption RPC exposure in the reviewed schemas.

The main maintainability problem is duplicated policy and protocol logic with
already-visible divergence. Share framework-independent consent, model policy,
tool schemas, sanitization, and wire schemas; keep runtime adapters separate. Keep
Studio's public state API stable and place backend selection/storage behavior in a
small adapter instead of growing the central state module and module-global mutable
`assistantConversationApi` registry.

Use generated database types and validated HTTP responses rather than pervasive
casts/untyped `SupabaseClient`. A concrete mismatch already slips through:
[updateConversation](/Users/saxonfletcher/Documents/Repositories/supabase/supabase/apps/studio/data/ai-assistant/conversation-update-mutation.ts:24)
maps the PATCH response as a row, but the endpoint returns `{ conversation }`.
Use the shared unwrap/validation contract. Split the 618-line route registry into
cohesive handlers, remove redundant timestamp updates, and use a Node ESLint preset
instead of Next/React rules for the worker.

Reports, notebooks, Braintrust tracing, and rating categorization are not at parity.
Tracing is absent rather than incorrectly enabled, so do not describe this as a
confirmed tracing data leak. Explicitly decide which capabilities are in the dogfood
contract; they cannot silently disappear under a general claim of frontend parity.

## Validation performed and coverage gaps

| Check                             | Result                                                                     |
| --------------------------------- | -------------------------------------------------------------------------- |
| Assistant Vitest suite            | 15 files, 94 tests passed                                                  |
| Assistant typecheck               | Passed                                                                     |
| Assistant build                   | Passed                                                                     |
| Assistant lint                    | Passed with five `any` warnings; Next/React configuration warnings         |
| Selected Studio regression tests  | 10 files, 78 tests passed                                                  |
| Local RLS verification            | Cross-user inserts reproduced with synthetic rows; transaction rolled back |
| Hosted Workers/OAuth browser flow | Not exercised; deployment behavior remains unverified                      |

Commands used the installed Node 24 runtime and pnpm's `.mjs` entry point to work
around the host's broken Corepack launcher. Studio checks covered the flag and OAuth
helpers, assistant state/hooks/cache effects, `generate-v4`, AI details, consent
filtering, and Studio/MCP tools. No full Studio build/typecheck or coverage percentage
was produced.

The new tests cover useful helpers, OAuth token storage mocks, router status codes,
and a text-only SSE fixture. `chat-route.test.ts` mocks authentication and never
completes an authenticated chat. There are no committed database RLS tests, OAuth
callback/session-exchange integration tests, backend-switch provider tests, or
approval/clear/edit/reload end-to-end tests. No workflow currently runs the assistant
test suite or worker bundle build; root lint/typecheck do include workspace tasks.

The legacy suite is materially stronger around policy resolution, SQL result
redaction, tool filtering, MCP lifecycle, and notebook/report behavior. It also has
a gap: `generate-v4.test.ts` passes despite its mock causing a caught stream
`pipeThrough` error. Preserve its policy assertions, but replace its obsolete stream
mock and assert successful SSE completion rather than treating it as full-route proof.

## Execution plan and exit criteria

1. **Secure admission, OAuth, and data policy.** Fix findings 1–4; bind identities
   as in finding 6. Add database-backed two-user tests and real auth middleware tests.
   Exit: unapproved cohorts, cross-user relationships, browser-swapped OAuth state,
   and policy-unavailable requests fail closed; valid owner flows still work.
2. **Make the existing frontend contract pass on both backends.** Fix history
   mutation semantics, tool event shapes, reconnect errors, support metadata, and
   branches. Add shared fixtures for text/reasoning, SQL approval/rejection/result,
   deployment approval, and errors. Verify one side effect per approved operation,
   including retries/disconnects. Fix the PATCH response shape.
3. **Prove containment and operational behavior.** Test flag false/undefined,
   partial configuration, self-hosting, late flag resolution, both toggle directions,
   missing local history, failed hydration, and project/account changes. Assert zero
   worker/exchange/OAuth calls when disabled and no unintended IndexedDB rewrites.
   Add MCP cleanup, bounded calls/history, exchange/refresh concurrency handling,
   and an assistant CI job for tests/typecheck/lint/build plus schema-policy checks.
4. **Run a bounded hosted dogfood verification.** Use an explicitly admitted cohort
   and test project with known consent settings. Verify worker SSE through ingress,
   auth expiry/reconnect, restart/disconnect persistence, approval retry safety, and
   a real flag-off rollback. Expand only after those checks pass. Keep `generate-v4`
   and its TanStack wrapper available throughout; do not automatically replay a
   potentially executed write on the legacy backend after a worker failure.
