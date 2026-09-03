# Studio Assistant → Supabase-hosted agent: architecture and migration plan

Status: proposal / handoff document
Owner: AI team
Target folder for the new app: `apps/assistant/`

This document is written so that an engineer (or coding agent) who has not seen the
current code can execute it phase by phase. Every phase has concrete file paths, a
contract, and acceptance criteria. Decisions that are already made are marked
**DECISION**. Things that must be checked against real APIs before coding are marked
**VERIFY**. Do not silently change a DECISION; if it turns out to be impossible, stop
and report.

---

## 0. Goal, non-goals, and why

**Goal.** Move the Studio AI Assistant backend out of Studio's Next.js API routes and
into its own Supabase project ("the assistant project") that is:

- a **Supabase OAuth App** (registered in the Supabase dashboard, using
  `https://api.supabase.com/v1/oauth/authorize` + Management API tokens) so it acts on
  users' projects the same way any third-party integration would;
- a **Postgres database** storing per-user, per-project conversations (today they live
  only in the browser's IndexedDB);
- a **Supabase Worker** (Node, `supabase/workers/<name>/index.mjs`, `export default { fetch(request) }`,
  running on AWS Lambda MicroVMs) serving the chat API;
- optionally, a **sandbox Worker image** that clones the user's connected GitHub repo and runs
  the Claude Agent SDK (formerly "Claude Code SDK") inside the MicroVM as a tool of the assistant.

Studio stays the primary UI and keeps the **exact same** panel/components; only the
transport, auth bootstrap, and persistence layer under it change. Later surfaces
(Slack, CLI, MCP) hit the same worker API.

**Why.** Dogfooding: build an agent on Supabase primitives (Auth, Postgres + RLS, Vault,
Realtime, Cron/Queues, Workers) starting with the agent we already ship.

**Non-goals for this plan.**

- Rewriting the assistant UI. `components/ui/AIAssistantPanel/**` is reused as-is
  except where explicitly listed in §9.
- Changing prompts, tools' semantics, opt-in privacy semantics, or model selection
  logic. These are _ported_, not redesigned.
- Self-hosted Studio. Self-hosted keeps the existing in-Studio route
  (`pages/api/ai/sql/generate-v4.ts`) until a later decision. The new path is
  `IS_PLATFORM`-only. Do not delete the old route in any phase of this plan.
- The satellite AI endpoints (`title-v2`, `filter-v1`, `cron-v2`, `policy`,
  `code/complete`, `docs`, `feedback/*`, `onboarding/design`). They stay in Studio.

---

## 1. Current state (what is being moved)

All paths relative to `apps/studio/`.

| Concern                        | Where it lives today                                                                                                                                                                                                                    | Notes                                                                                                                                                                                                                                                                    |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Chat endpoint                  | `pages/api/ai/sql/generate-v4.ts` (mirrored by `routes/api/ai/sql/generate-v4.ts`)                                                                                                                                                      | `POST`, Vercel AI SDK, UI message stream via `pipeUIMessageStreamToResponse`. `maxDuration = 120`.                                                                                                                                                                       |
| Orchestration                  | `lib/ai/generate-assistant-response.ts`                                                                                                                                                                                                 | `streamText`, `stopWhen: isStepCount(10)`, static system prompt + dynamic "assistant context" messages, Braintrust tracing.                                                                                                                                              |
| Prompts                        | `lib/ai/prompts.ts`, `lib/ai/assistant-context.ts`                                                                                                                                                                                      | `GENERAL_PROMPT`, `CHAT_PROMPT`, `NOTEBOOKS_PROMPT`, `SECURITY_PROMPT`, `LIMITATIONS_PROMPT`, `buildAssistantContextMessages`.                                                                                                                                           |
| Message windowing / sanitising | `lib/ai/generate-assistant-response.utils.ts`, `lib/ai/message-utils.ts`, `lib/ai/assistant-message-metadata.ts`                                                                                                                        | Last 7 messages; strips SQL rows unless full data opt-in.                                                                                                                                                                                                                |
| Tools                          | `lib/ai/tools/index.ts` (`getTools`) + `studio-tools.ts`, `mcp-tools.ts`, `schema-tools.ts`, `report-tools.ts`, `incident-tools.ts`, `notebook-tools.ts`, `support-tools.ts`, `fallback-tools.ts`; allowlist in `lib/ai/tool-filter.ts` | `execute_sql` / `deploy_edge_function` are `needsApproval: true`. MCP tools already can come from the **remote** Supabase MCP server (`USE_REMOTE_MCP`).                                                                                                                 |
| Opt-in / entitlement           | `lib/ai/ai-details.ts` (`getAIDetails`), `hooks/misc/useOrgOptedIntoAi.ts`                                                                                                                                                              | Levels: `disabled` < `schema` < `schema_and_log` < `schema_and_log_and_data`; HIPAA + sensitive ⇒ `disabled`; `assistant.advance_model` entitlement.                                                                                                                     |
| Models                         | `lib/ai/model.ts`, `lib/ai/model.utils.ts`                                                                                                                                                                                              | OpenAI via `@ai-sdk/openai`; Bedrock path exists but unused for chat. `IS_THROTTLED` downgrade.                                                                                                                                                                          |
| Frontend transport             | `state/ai-assistant-state.tsx` (`createChatInstance`)                                                                                                                                                                                   | `new Chat({ transport: new DefaultChatTransport({ api: .../generate-v4, prepareSendMessagesRequest }) })`; sends `messages` (last 7), `projectRef`, `connectionString`, `chatId`, `chatName`, `supportMode`, `orgSlug`, `model`, `Authorization: Bearer <platform jwt>`. |
| Persistence                    | `state/ai-assistant-state.tsx`                                                                                                                                                                                                          | valtio proxy → IndexedDB `ai-assistant-db` / store `assistantState`, keyed by `projectRef`. Types `ChatSession`, `StoredAiAssistantState`.                                                                                                                               |
| Approvals                      | AI SDK `needsApproval` + `addToolApprovalResponse` + `lastAssistantMessageIsCompleteWithApprovalResponses`                                                                                                                              | Rendered by `Confirm.tsx` in the panel.                                                                                                                                                                                                                                  |

Two properties of the current design matter most for the migration:

1. **The client supplies `connectionString` and the platform JWT**, and server tools call
   Studio's internal data layer (`executeSql`, content APIs) with that JWT. In the new
   design the worker never sees a connection string; it uses the **Management API /
   remote MCP server with an OAuth token** instead.
2. **The wire format is the AI SDK UI message stream.** Keeping it means the panel keeps
   working with almost no changes.

---

## 2. Target architecture

```
┌──────────────────────────┐          ┌──────────────────────────────────────────────┐
│ Studio (browser)         │          │ Assistant Supabase project                   │
│  AIAssistantPanel        │  HTTPS   │                                              │
│  useChat + Chat transport├─────────►│ Worker: supabase/workers/api  (Node, fetch)  │
│  Authorization:          │  SSE     │   withSupabase({auth:'user'}) → ctx.supabase │
│   Bearer <assistant jwt> │◄─────────┤   AI SDK streamText + tools                  │
└──────────┬───────────────┘          │      │            │             │            │
           │ one-time                 │      │            │             │            │
           │ POST /auth/exchange      │      ▼            ▼             ▼            │
           │ (platform jwt →          │  Postgres     Vault (OAuth   Sandbox         │
           │  assistant session)      │  conversations tokens)       orchestrator    │
           │                          │  messages ...                  │             │
           │                          └────────────────────────────────┼─────────────┘
           │                                   │                       │
           ▼                                   ▼                       ▼
  api.supabase.com/v1/oauth/*        mcp.supabase.com /             Worker: supabase/workers/sandbox
  (consent, code → tokens)           api.supabase.com/v1/*          (MicroVM image: git + node +
                                     with OAuth access token        @anthropic-ai/claude-agent-sdk)
                                     → user's project                 │ clones GitHub repo
                                                                      ▼
                                                                 github.com (GitHub App)
```

Components:

- **API worker** (`supabase/workers/api`): the single public HTTP surface. Auth via
  `@supabase/server`. Owns conversations, runs the agent loop, calls the user's project
  through OAuth-scoped Management API / MCP, orchestrates sandboxes.
- **Postgres**: conversations, messages, OAuth connections, GitHub installations,
  sandboxes. RLS on everything user-scoped.
- **Sandbox worker image** (`supabase/workers/sandbox`): not a public API. One MicroVM per
  (conversation, repo). Exposes a small internal HTTP API to the API worker only.
- **Supabase OAuth App** registration: gives the assistant Management API access to the
  user's org/projects with scopes the user consents to.
- **GitHub App**: gives the sandbox a short-lived installation token to clone/push.

---

## 3. Repository layout (new workspace `apps/assistant/`)

```
apps/assistant/
  package.json                     # name: "assistant"; deps: ai, @ai-sdk/openai, @supabase/server,
                                   # @supabase/supabase-js, @supabase/mcp-server-supabase, zod, common-tags, braintrust
  tsconfig.json
  esbuild.config.mjs               # bundles supabase/workers/*/index.ts → index.mjs (node, esm)
  supabase/
    config.toml                    # [workers.*], [experimental.pgdelta]
    schemas/                       # pg-delta source of truth (§5)
      _cluster/extensions.sql
      public/tables/*.sql
      private/schema.sql
      private/functions/*.sql
    migrations/                    # generated by `db schema declarative sync`; do not edit by hand
    seed.sql
    workers/
      api/
        index.ts                   # entry: export default { fetch }
        local.ts                   # Node HTTP adapter for `pnpm dev`
        chat-route.test.ts
        index.mjs                  # BUILD OUTPUT – Node fetch handler
        src/                       # worker implementation (http, ai, platform, db)
          http/
            router.ts              # tiny path/method router over Request/Response (no framework, or Hono)
            auth.ts                # withSupabase wrappers + platform-JWT verifier (§4)
            errors.ts
          ai/                      # PORTED from apps/studio/lib/ai (see §7 port table)
            prompts.ts
            assistant-context.ts
            assistant-message-metadata.ts
            generate-assistant-response.ts
            generate-assistant-response.utils.ts
            model.ts, model.utils.ts
            tool-filter.ts
            tools/
              index.ts, studio-tools.ts (renamed project-tools.ts), mcp-tools.ts, report-tools.ts,
              incident-tools.ts, knowledge/*, sandbox-tools.ts (new)
          platform/
            management-api.ts      # typed fetch to api.supabase.com/v1 with OAuth token; refresh handling
            oauth.ts               # authorize URL (PKCE), code exchange, refresh
            ai-details.ts          # PORTED getAIDetails, re-implemented over Management API (§6.4)
          db/
            conversations.ts       # load/save UIMessage[] (uses ctx.supabase, RLS)
            oauth-connections.ts   # Vault-backed token storage (uses ctx.supabaseAdmin)
            sandboxes.ts
          sandbox/
            provider.ts            # SandboxProvider interface
            lambda-microvm-provider.ts
            local-docker-provider.ts
            client.ts              # API worker → sandbox VM HTTP client
      sandbox/
        Dockerfile                 # §8 MicroVM image: node 22, git, gh, @anthropic-ai/claude-agent-sdk
        index.ts
        index.mjs                  # BUILD OUTPUT – internal HTTP API run inside the sandbox VM
  PLAN.md                          # this file
```

**DECISION:** The assistant is a Supabase project. Workers, schema, and config live under
`supabase/`. TypeScript worker entries are `supabase/workers/<name>/index.ts` and are
bundled with esbuild to the `index.mjs` format the runtime loads:

```js
// supabase/workers/test/index.mjs — the shape every worker entry must have
export default {
  fetch(request) {
    const { pathname } = new URL(request.url)
    return Response.json({
      worker: 'hello-node',
      path: pathname,
      greeting: process.env.GREETING ?? null,
    })
  },
}
```

So the runtime is **Node with Web `Request`/`Response`**, `process.env` for secrets, and a
single default export with `fetch`. `@supabase/server`'s `withSupabase(config, handler)`
returns exactly this `(request) => Promise<Response>` shape, which is why it fits.

**VERIFY (before Phase 1):** that the Workers runtime supports (a) streaming
`Response` bodies (`ReadableStream`, SSE) for long-lived chat responses, (b) a request
timeout ≥ 120 s (today's `maxDuration`), (c) outbound HTTPS to `api.openai.com`,
`api.supabase.com`, `mcp.supabase.com`, `api.github.com`, and the sandbox VMs. If (a) is
not supported, fall back to the Realtime plan in §6.6.

### 3.1 Experimental Workers CLI (source of truth for deploy)

Workers are **not** Edge Functions. They are managed only through the **beta** CLI
(`experimental workers`). The stable 2.x CLI (`brew install supabase`, `npx supabase@latest`,
this monorepo's `supabase` package) does **not** have this command.

**Always invoke via `npx supabase@beta`** so you get the newest 3.x beta, not whatever
is on `PATH`. Re-read `--help` at the start of every session — this surface is
explicitly unstable (excluded from the CLI compatibility promise; flags, output, and
invocation path can change or be removed in any release):

```bash
npm view supabase@beta version          # confirm you are on the current beta
npx --yes supabase@beta --version
npx --yes supabase@beta experimental workers --help
```

Checked 2026-09-03: `latest` = `2.116.0` (no workers command); `beta` = `3.0.0-beta.10`
(workers present). Description from the CLI: _containers that run your code next to
your project, deployed from `supabase/workers/<name>/`._

| Command                                 | Purpose                                                                                                    |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `experimental workers new <name>`       | Scaffold locally. Records runtime/size/source in `supabase/config.toml`. Nothing is deployed.              |
| `experimental workers push [<name...>]` | Build and deploy into the linked project. Reads runtime, size, source from `config.toml`. Alias: `deploy`. |
| `experimental workers list`             | Union of `config.toml` entries and what the Workers API reports.                                           |
| `experimental workers status <name>`    | Build state, size, access, image, live instance tally, source directory.                                   |
| `experimental workers delete <name>`    | Remove from Supabase. `--yes` skips the name-confirm prompt (CI).                                          |

`new` flags that matter for this app:

- `--runtime node` — API worker (`api`). Also available: `deno`, `dockerfile`.
- `--runtime dockerfile` — sandbox worker (`sandbox`); we need a custom image (git, Claude Agent SDK).
- `--size 2gb \| 4gb` — instance size recorded in `config.toml`. Each size implies its own vCPU count; there is no separate `--cpu`.
- `--source <path>` — only if a worker must live outside `supabase/workers/`. Do **not**
  use this for the API worker; scaffold in place (`supabase/workers/api`).

`push` flags: `--instances` (overrides `config.toml`, falls back to recorded value then 1), `--project-ref`.

All of these take `--workdir` (path to a Supabase project directory). From the monorepo root:

```bash
# once, in apps/assistant (or --workdir apps/assistant)
npx --yes supabase@beta experimental workers new api --runtime node --size 2gb
npx --yes supabase@beta experimental workers new sandbox --runtime dockerfile --size 4gb

npx --yes supabase@beta experimental workers push api
npx --yes supabase@beta experimental workers status api
```

**DECISION:** Use this CLI for scaffold, deploy, inspect, and delete. Do not invent a
parallel deploy path (no wrapping as an Edge Function, no hand-rolled MicroVM API
client for the _API_ worker). The sandbox _orchestration_ API in §8 is a separate
question (launching extra VMs at request time); the sandbox _image_ itself is still
built and published with `workers push sandbox`.

**VERIFY in Phase 0 by actually running `new` + `push`:** what `config.toml` keys get
written (`[workers.api]` runtime/size/source/instances?); whether secrets are the
same as Edge Function secrets (`supabase secrets set`) or a workers-specific path;
the public hostname (`<name>` "doubles as its hostname"); streaming / timeout / egress
on a `node` runtime worker.

---

## 4. Identity, auth, and `@supabase/server`

There are **three different credentials** in this system. Keep them separate in code and
in the DB.

| Credential                                    | Issued by                             | Used for                                                           | Where it lives                                                         |
| --------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| **Platform JWT** (what Studio already has)    | Supabase platform GoTrue              | Only to bootstrap an assistant session (§4.1)                      | Browser; sent once to `/auth/exchange`                                 |
| **Assistant session JWT**                     | The assistant project's Supabase Auth | Every call to the API worker; RLS in the assistant DB              | Browser (memory/localStorage via supabase-js), `Authorization: Bearer` |
| **Management API OAuth access/refresh token** | `api.supabase.com/v1/oauth/token`     | Acting on the user's org/projects (SQL, functions, logs, advisors) | Vault in the assistant DB, per (user, org)                             |

### 4.1 Identity: one assistant-project Auth user per platform user

**DECISION:** Users of the assistant are real `auth.users` rows in the assistant project.
This is what makes `withSupabase({ auth: 'user' })`, RLS, Realtime, and later Slack
linking work without custom code.

Bootstrap from Studio (no consent screen; first-party trust):

1. Studio calls `POST {ASSISTANT_URL}/auth/exchange` with `Authorization: Bearer <platform jwt>`.
2. Worker verifies the platform JWT against the **platform** GoTrue JWKS
   (**VERIFY** the URL; it is the JWKS of the platform auth server Studio logs in against,
   not of the assistant project). Reject on failure. Extract `sub` (platform user id) and `email`.
3. Worker (using `ctx.supabaseAdmin`, i.e. service role) upserts
   `public.platform_identities (platform_user_id, user_id)`; if none exists, creates an
   auth user via `supabaseAdmin.auth.admin.createUser({ email, email_confirm: true, app_metadata: { platform_user_id } })`.
4. Worker mints a session for that user and returns it to Studio. Implementation:
   `supabaseAdmin.auth.admin.generateLink({ type: 'magiclink', email })` → take
   `properties.hashed_token` → `anonClient.auth.verifyOtp({ type: 'magiclink', token_hash })` →
   return `{ access_token, refresh_token, expires_at }`. (**VERIFY** on current supabase-js;
   if a cleaner admin "create session" API exists, use it.)
5. Studio stores the session with a dedicated supabase-js client (`createClient(ASSISTANT_URL_SUPABASE, ASSISTANT_PUBLISHABLE_KEY)`),
   and uses `session.access_token` in the chat transport. Refresh is handled by supabase-js.

This endpoint is `auth: 'none'` at the `withSupabase` level (the platform JWT is not an
assistant-project credential) and does its own verification. Rate-limit it.

**Alternative considered and rejected for v1:** making the platform JWT the only identity
and using `supabaseAdmin` with manual `user_id` filters everywhere. Rejected because it
bypasses RLS and does not extend to Slack.

### 4.2 Authorization to the user's projects: Supabase OAuth App

**DECISION:** The assistant is registered as an OAuth App in the Supabase dashboard.
Scopes requested (**VERIFY** exact names in the dashboard): Database read+write,
Edge Functions read+write, Analytics/Logs read, Organizations read, Projects read,
Auth read (for advisors). Users consent per **organization**.

Flow (worker routes, all under `/oauth/*`):

- `GET /oauth/start?org_slug=…&return_to=…` — `auth: 'user'`. Generates PKCE
  `code_verifier`/`code_challenge` and a random `state`; stores
  `{ state, code_verifier, user_id, org_slug, return_to, expires_at }` in `oauth_states`;
  redirects to `https://api.supabase.com/v1/oauth/authorize?client_id&redirect_uri&response_type=code&state&code_challenge&code_challenge_method=S256`.
- `GET /oauth/callback?code&state` — `auth: 'none'`. Looks up `state`, exchanges the code at
  `POST https://api.supabase.com/v1/oauth/token` (`grant_type=authorization_code`,
  `code_verifier`, `redirect_uri`), stores tokens in Vault (§5), upserts
  `oauth_connections (user_id, org_slug, vault_secret_id, expires_at, scopes)`, redirects to `return_to`.
- Refresh: `platform/oauth.ts#getValidAccessToken(userId, orgSlug)` refreshes when
  `expires_at - now < 5 min` using `grant_type=refresh_token`, and rewrites the Vault secret.

Studio UX: when the chat route returns `409 { code: 'oauth_required', org_slug }`, the panel
shows a "Connect Supabase Assistant to <org>" button that opens `/oauth/start` in a popup.
Reuse copy patterns from the existing integrations pages.

### 4.3 What `@supabase/server` gives us (and what it doesn't)

Use it. Concretely:

```ts
// supabase/workers/api/index.ts
import { withSupabase } from '@supabase/server'

import { router } from './src/http/router'

export default {
  fetch: (request: Request) => router(request),
}

// supabase/workers/api/src/http/router.ts (excerpt)
const userRoute = (handler) => withSupabase({ auth: 'user' }, handler) // ctx.supabase (RLS), ctx.userClaims
const openRoute = (handler) => withSupabase({ auth: 'none' }, handler) // /health, /oauth/callback, /auth/exchange
const internalRoute = (handler) => withSupabase({ auth: 'secret' }, handler) // sandbox VM → api callbacks
```

- `auth: 'user'`: verifies the **assistant-project** JWT via JWKS, gives `ctx.supabase`
  (RLS-scoped client — use for all conversation reads/writes), `ctx.supabaseAdmin`
  (service role — use only for Vault and identity ops), `ctx.userClaims.id`.
- `auth: 'none'`: no verification; used for the two bootstrap endpoints and health.
- `auth: 'secret'`: service-to-service; used when the sandbox VM posts events back.
- Built-in CORS handling: configure `cors` to allow the Studio origins
  (`https://supabase.com`, `https://*.supabase.green`, `http://localhost:8082`).
- Middleware `@supabase/server/middleware/postgres` (`withPostgresClient`) is available if
  raw SQL against the assistant DB is ever needed; not needed in v1.
- `withOAuthProtectedResource` (RFC 9728) becomes relevant in Phase 5 if the worker is
  exposed as an MCP server for external agents/Slack. Not used in v1.

What it does **not** do, and we implement ourselves: verifying the _platform_ JWT
(§4.1 step 2), the Supabase OAuth App client flow (§4.2), and Management API calls. Do not
try to bend `withSupabase` into doing these.

Environment variables the worker needs (set in the Workers config, read via `process.env`):
`SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` (auto-resolved by
`@supabase/server` when running inside Supabase — **VERIFY** for Workers), `PLATFORM_JWKS_URL`,
`SUPABASE_OAUTH_CLIENT_ID`, `SUPABASE_OAUTH_CLIENT_SECRET`, `SUPABASE_OAUTH_REDIRECT_URI`,
`OPENAI_API_KEY`, `ANTHROPIC_API_KEY` (sandbox only), `GITHUB_APP_ID`, `GITHUB_APP_PRIVATE_KEY`,
`BRAINTRUST_*` (optional), `IS_THROTTLED`, `SANDBOX_PROVIDER=lambda|local`.

---

## 5. Data model (assistant project Postgres)

**DECISION:** Schema is declarative via pg-delta. Edit files under `supabase/schemas/`
(layout `public/tables/…`, `private/functions/…`, `_cluster/…`). Enable in `config.toml`:

```toml
[experimental.pgdelta]
enabled = true
declarative_schema_path = "./schemas"
```

Generate or refresh migrations with the beta CLI (never hand-edit `supabase/migrations/`
after the initial apply):

```bash
npx --yes supabase@beta db schema declarative sync -f <name>
# `--no-apply` writes the migration without applying it locally
```

Follow Supabase Postgres rules: `text` not `varchar`, `timestamptz`, `uuid` PKs via
`gen_random_uuid()`, enable RLS on every table, policies `to authenticated` using
`(select auth.uid())`, and index every column used in a policy or foreign key.

```sql
-- identity
create table public.platform_identities (
  platform_user_id uuid primary key,                 -- `sub` of the platform JWT
  user_id uuid not null unique references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);
alter table public.platform_identities enable row level security;
create policy "own identity" on public.platform_identities for select to authenticated
  using (user_id = (select auth.uid()));

-- management api oauth
create table public.oauth_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  org_slug text not null,
  vault_secret_id uuid not null,                     -- vault.secrets.id holding JSON {access_token, refresh_token}
  scopes text[] not null default '{}',
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, org_slug)
);
create index on public.oauth_connections (user_id);
alter table public.oauth_connections enable row level security;
create policy "own connections (metadata only)" on public.oauth_connections for select to authenticated
  using (user_id = (select auth.uid()));
-- writes are service-role only (no insert/update policy for authenticated)

create table public.oauth_states (                    -- short-lived PKCE state
  state text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  org_slug text not null,
  code_verifier text not null,
  return_to text,
  expires_at timestamptz not null
);
alter table public.oauth_states enable row level security;  -- service-role only

-- conversations
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_ref text not null,
  org_slug text not null,
  name text not null default 'Untitled',
  model text,
  support_metadata jsonb,                            -- SupportChatMetadata, nullable
  branched_from jsonb,                               -- { chatId, messageId }
  surface text not null default 'studio',            -- 'studio' | 'slack' | ...
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index on public.conversations (user_id, project_ref, updated_at desc);
alter table public.conversations enable row level security;
create policy "own conversations" on public.conversations for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create table public.messages (
  id text not null,                                  -- AI SDK UIMessage.id (client-generated) — keep as-is
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user','assistant','system')),
  parts jsonb not null,                              -- UIMessage.parts verbatim
  metadata jsonb,                                    -- UIMessage.metadata (assistantMessageMetadataSchema)
  seq bigint generated always as identity,           -- ordering
  created_at timestamptz not null default now(),
  primary key (conversation_id, id)                  -- ids are unique per chat, not globally (branching copies them)
);
create index on public.messages (conversation_id, seq);
create index on public.messages (user_id);
alter table public.messages enable row level security;
create policy "own messages" on public.messages for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create table public.message_feedback (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null,
  message_id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating text not null check (rating in ('positive','negative')),
  reason text,
  braintrust_span_id text,
  created_at timestamptz not null default now(),
  foreign key (conversation_id, message_id) references public.messages (conversation_id, id) on delete cascade
);
create index on public.message_feedback (conversation_id, message_id);
create index on public.message_feedback (user_id);
alter table public.message_feedback enable row level security;
create policy "own feedback" on public.message_feedback for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- github + sandboxes (Phase 4)
create table public.github_installations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  installation_id bigint not null,
  account_login text not null,
  created_at timestamptz not null default now(),
  unique (user_id, installation_id)
);
create index on public.github_installations (user_id);
alter table public.github_installations enable row level security;
create policy "own installations" on public.github_installations for select to authenticated
  using (user_id = (select auth.uid()));

create table public.project_repos (                  -- which repo a project_ref is connected to
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_ref text not null,
  installation_id bigint not null,
  repo_full_name text not null,                      -- "owner/name"
  default_branch text not null default 'main',
  created_at timestamptz not null default now(),
  unique (user_id, project_ref)
);
create index on public.project_repos (user_id);
alter table public.project_repos enable row level security;
create policy "own repos" on public.project_repos for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create table public.sandboxes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  project_repo_id uuid not null references public.project_repos(id) on delete cascade,
  provider text not null,                            -- 'lambda' | 'local'
  provider_ref text,                                 -- MicroVM id
  endpoint_url text,
  status text not null check (status in ('pending','running','suspended','terminated','error')),
  branch text not null,                              -- e.g. assistant/<conversation_id>
  agent_session_id text,                             -- Claude Agent SDK session id for `resume`
  last_activity_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  terminated_at timestamptz
);
create index on public.sandboxes (conversation_id);
create index on public.sandboxes (user_id);
create index on public.sandboxes (status, last_activity_at);
alter table public.sandboxes enable row level security;
create policy "own sandboxes" on public.sandboxes for select to authenticated
  using (user_id = (select auth.uid()));
```

Notes:

- **Vault:** store OAuth tokens with `vault.create_secret(json, name)` from the worker via
  `supabaseAdmin.rpc` wrappers (create `security definer` functions
  `store_oauth_tokens(...)` / `read_oauth_tokens(...)` in `private` schema, executable by
  service role only). Never put tokens in a normal column.
- **Message storage:** one row per AI SDK `UIMessage`, `parts` stored verbatim. This lets
  the client re-hydrate with zero transformation. Do not normalise parts into their own
  table in v1.
- **Retention:** `pg_cron` jobs — purge `oauth_states` older than 15 min hourly; terminate
  sandboxes with `last_activity_at < now() - interval '2 hours'` (§8); soft-deleted
  conversations hard-deleted after 30 days.
- **Realtime:** enable `supabase_realtime` publication on `public.messages` and
  `public.sandboxes` so non-Studio surfaces (and a second Studio tab) can follow a
  conversation without SSE.

---

## 6. API worker contract

Base URL: `ASSISTANT_URL` (the worker's public URL). All JSON. All `/v1/*` routes are
`auth: 'user'`.

| Method & path                             | Auth                                  | Purpose                                                                           |
| ----------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------- |
| `GET /health`                             | none                                  | liveness                                                                          |
| `POST /auth/exchange`                     | none (platform JWT verified manually) | §4.1                                                                              |
| `GET /oauth/start`, `GET /oauth/callback` | user / none                           | §4.2                                                                              |
| `GET /v1/me`                              | user                                  | `{ user_id, connections: [{ org_slug, scopes, expires_at }], repos: [...] }`      |
| `GET /v1/projects/:ref/conversations`     | user                                  | list (id, name, updated_at, support_metadata) — replaces `useAiAssistantChatList` |
| `POST /v1/projects/:ref/conversations`    | user                                  | create `{ name?, org_slug, model?, branched_from? }`                              |
| `GET /v1/conversations/:id`               | user                                  | conversation + `messages: UIMessage[]`                                            |
| `PATCH /v1/conversations/:id`             | user                                  | rename / model change                                                             |
| `DELETE /v1/conversations/:id`            | user                                  | soft delete                                                                       |
| `POST /v1/conversations/:id/chat`         | user                                  | **the streaming chat endpoint** (§6.1)                                            |
| `POST /v1/messages/:id/feedback`          | user                                  | thumbs up/down (port of `feedback/rate.ts` classification is optional)            |
| `POST /v1/projects/:ref/repo`             | user                                  | connect a GitHub repo (Phase 4)                                                   |
| `POST /internal/sandboxes/:id/events`     | secret                                | sandbox VM → worker event sink (Phase 4)                                          |

### 6.1 Chat endpoint

Request body (`zod`, mirrors today's `requestBodySchema` minus `connectionString`):

```ts
{
  // AI SDK "send only the new message" mode. The server owns history.
  message: UIMessage,                 // the new user message OR the assistant message carrying approval responses
  trigger: 'submit-message' | 'regenerate-message' | 'approval-response',
  messageId?: string,                 // for regenerate
  model?: AssistantModelId,
  supportMode?: boolean,
}
```

Server steps (this is `handlePost` from `generate-v4.ts`, re-homed):

1. Load conversation (RLS via `ctx.supabase`); 404 if missing. Read `project_ref`, `org_slug`, `name`.
2. Upsert the incoming `message` row (by `id`). For `approval-response`, this overwrites the
   stored assistant message with its `tool-*` parts now in `approval-responded` state.
3. Load all messages for the conversation ordered by `seq`; run `prepareMessagesForModel`
   (ported; still last 7 + sanitising).
4. Resolve Management API token: `getValidAccessToken(userId, org_slug)`; if none → `409 oauth_required`.
5. Resolve AI details (§6.4) → `aiOptInLevel`, `hasAccessToAdvanceModel`, HIPAA/sensitive/region.
6. Resolve model exactly as today (`requestedModel ?? DEFAULT_ASSISTANT_BASE_MODEL_ID`, downgrade rules).
7. `getTools({...})` (§7) with the **OAuth token** instead of `connectionString` + platform JWT.
8. `generateAssistantResponse(...)` (ported unchanged except imports) → `result`.
9. Return `result.toUIMessageStreamResponse({ originalMessages, sendReasoning: true, onError, onFinish })`
   — this yields a Web `Response`, which is what the worker `fetch` handler must return. No
   `pipeUIMessageStreamToResponse`.
10. In `onFinish({ messages })`: upsert every new/changed assistant message row; if a
    `rename_chat` tool call happened, update `conversations.name`; bump `updated_at`.
11. Abort handling: `request.signal` replaces today's `req.on('close')`; pass it as
    `abortSignal` and to `getTools` so the MCP HTTP connection is closed.

Response headers: keep `x-braintrust-span-id` when tracing is on.

### 6.2 Approvals

Unchanged protocol. `execute_sql`, `deploy_edge_function`, notebook writes keep
`needsApproval: true`. The client keeps `sendAutomaticallyWhen:
lastAssistantMessageIsCompleteWithApprovalResponses`. The only difference is that the
client sends the approval-carrying assistant message as `message` with
`trigger: 'approval-response'` instead of the whole history (step 2 above handles it).

### 6.3 Where tool side effects run

Today `execute_sql.execute` calls Studio's `executeSql` with the platform JWT. In the
worker it calls the Management API `POST /v1/projects/{ref}/database/query` with the
OAuth token (or the remote MCP server's `execute_sql`, once it accepts OAuth tokens —
**VERIFY** and prefer MCP if available so we keep one client). Same for
`deploy_edge_function` → `POST /v1/projects/{ref}/functions/deploy`. Read-only tools
(`list_tables`, `get_advisors`, `query_logs`, `search_docs`, …) come from the remote MCP
server exactly as `mcp-tools.ts` does today with `USE_REMOTE_MCP=true`; the in-process
fallback is **not** ported.

### 6.4 Opt-in, HIPAA, entitlements (port of `ai-details.ts`)

Today this uses Studio-internal endpoints with the platform JWT. Re-implement over the
Management API with the OAuth token:

- `GET /v1/organizations/{slug}` → `opt_in_tags` (**VERIFY** field is present in the
  public response; if not, this is a hard blocker to raise with the platform team — the
  assistant must not run with a guessed opt-in level). Map with the ported `getAiOptInLevel`.
- `GET /v1/projects/{ref}` → `organization_id`, `region`; assert project ∈ org, otherwise
  `disabled` (same fail-closed behaviour as today).
- HIPAA add-on / `is_sensitive` / `assistant.advance_model` entitlement: **VERIFY**
  Management API coverage. If unavailable, Phase 1 ships with `hasAccessToAdvanceModel = false`
  and tracing disabled (`allowTracing = false`) — both are the conservative defaults — and
  we file requests to expose them. Document the gap in `supabase/workers/api/src/platform/ai-details.ts`.

All four privacy layers must survive the port: `getAIDetails` level, `filterToolsByOptInLevel`
(tool stubs), `execute_sql.toModelOutput` row hiding, and `sanitizeMessagePart` history
stripping.

### 6.5 Rate limiting

None exists today. Add a simple per-user token bucket in Postgres
(`private.rate_limits(user_id, window_start, count)` via an `rpc`), 30 chat requests / 5 min
by default, configurable by env. Return `429`.

### 6.6 Fallback if streaming responses are not available on Workers

Keep the same code but: write UI-stream chunks to `public.message_stream_chunks(conversation_id, seq, chunk)`
and have the client subscribe via Realtime and feed chunks into a custom `ChatTransport`.
Only build this if the §3 VERIFY fails; otherwise ignore.

---

## 7. Tool and module port table

`apps/studio/lib/ai/…` → `apps/assistant/supabase/workers/api/src/ai/…`. Copy, then fix imports. Do not
"improve" while porting.

| Today                                                                                                                                                                                                                                                      | New                                                                                                    | Change                                                                                                                                      |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `prompts.ts`, `assistant-context.ts`, `assistant-message-metadata.ts`, `generate-assistant-response.ts`, `generate-assistant-response.utils.ts`, `message-utils.ts`, `tool-filter.ts`, `model.ts`, `model.utils.ts`, `braintrust-logger.ts`, `knowledge/*` | same names                                                                                             | Imports only. `IS_PLATFORM` is always true in the worker; delete self-host branches.                                                        |
| `tools/index.ts#getTools({ projectRef, connectionString, authorization, accessToken, ... })`                                                                                                                                                               | `getTools({ projectRef, oauthToken, aiOptInLevel, supportMode, isExplorerEnabled, sandbox?, signal })` | Drop `connectionString`, `authorization`, `baseUrl`. Drop `getFallbackTools`.                                                               |
| `tools/studio-tools.ts` (`execute_sql`, `deploy_edge_function`, `rename_chat`, `load_knowledge`)                                                                                                                                                           | `tools/project-tools.ts`                                                                               | `execute_sql` / `deploy_edge_function` call Management API (§6.3). `rename_chat` stays server-stub + client.                                |
| `tools/mcp-tools.ts` + `supabase-mcp.ts`                                                                                                                                                                                                                   | same                                                                                                   | Remote only; pass OAuth token as the MCP bearer. Keep `EXPECTED_MCP_TOOLS` drift check and `UI_EXECUTED_TOOLS` removal.                     |
| `tools/schema-tools.ts` (`list_policies`)                                                                                                                                                                                                                  | same                                                                                                   | Executes SQL via Management API.                                                                                                            |
| `tools/report-tools.ts`, `tools/incident-tools.ts`                                                                                                                                                                                                         | same                                                                                                   | **VERIFY** reports/incidents endpoints exist on Management API; if not, omit in Phase 1 and note in the tool-filter allowlist.              |
| `tools/notebook-tools.ts`                                                                                                                                                                                                                                  | deferred                                                                                               | Notebooks are Studio-content-API-bound and behind the Explorer flag. Not ported in this plan; keep `isExplorerEnabled=false` in the worker. |
| `tools/support-tools.ts`                                                                                                                                                                                                                                   | same                                                                                                   | Pure stubs; port as-is.                                                                                                                     |
| —                                                                                                                                                                                                                                                          | `tools/sandbox-tools.ts` (new, §8)                                                                     | `run_coding_task` (`needsApproval: true`), `get_sandbox_status`, `open_pull_request` (`needsApproval: true`).                               |
| `ai-details.ts`                                                                                                                                                                                                                                            | `platform/ai-details.ts`                                                                               | Rewritten over Management API (§6.4).                                                                                                       |
| `pages/api/ai/sql/generate-v4.ts`                                                                                                                                                                                                                          | `workers/api` chat route (§6.1)                                                                        | Next `req/res` → `Request/Response`.                                                                                                        |
| `lib/api/generate-v4.test.ts`                                                                                                                                                                                                                              | `supabase/workers/api/chat-route.test.ts`                                                              | Same assertions, new harness (call `fetch(new Request(...))` directly).                                                                     |

`tool-filter.ts` `TOOL_CATEGORY_MAP` gets the three sandbox tools added under a new
category `CODE` that requires at least `schema` opt-in (repository contents are the user's,
not the DB's, but the agent will read the DB schema to write migrations).

---

## 8. Sandbox: GitHub repo + Claude Agent SDK in a MicroVM

### 8.1 What it does for the user

In a conversation about project `abc123` whose repo is connected, the assistant can call
`run_coding_task({ task, branch? })`. After approval, a sandbox VM for this conversation is
launched (or resumed), the repo is present at `/repo` on branch `assistant/<conversation_id>`,
and the Claude Agent SDK runs the task with the Supabase MCP server available inside the
sandbox (so the coding agent can also inspect the project's schema). Events stream back
into the chat as `data-sandbox` UI parts (tool use, file edits, summaries). When done, the
assistant offers `open_pull_request` (approval-gated), which pushes and opens a PR via
the GitHub App.

### 8.2 GitHub connection

**DECISION:** The assistant has its **own GitHub App** (not the platform's branching
integration; those installation tokens are platform-internal). Permissions: `contents:
read/write`, `pull_requests: write`, `metadata: read`. Install flow:
`GET /v1/github/install` (redirect to the app's install URL with `state`) →
`GET /github/callback?installation_id&state` (`auth: 'none'`, state-bound) → insert
`github_installations`. Then `POST /v1/projects/:ref/repo { installation_id, repo_full_name }`
inserts `project_repos`. Installation tokens are minted per sandbox launch with
`POST /app/installations/{id}/access_tokens` and **scoped to the single repository**; they
live ≤ 1 h and are passed to the sandbox as an env var, never stored.

### 8.3 Sandbox image (`supabase/workers/sandbox/Dockerfile`)

```
FROM public.ecr.aws/amazonlinux/amazonlinux:2023   # MicroVMs run AL2023; arm64
RUN dnf install -y git nodejs22 && npm i -g @anthropic-ai/claude-agent-sdk @anthropic-ai/claude-code
COPY index.mjs /app/index.mjs
ENV NODE_ENV=production
EXPOSE 8080
CMD ["node", "/app/index.mjs"]
```

`index.mjs` is a tiny HTTP server (also `export default { fetch }` for symmetry) with:

| Path          | Purpose                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /init`  | `{ repo_full_name, branch, base_branch, github_token }` → `git clone --depth 50`, checkout/create branch, `npm ci` best-effort. Idempotent.                                                                                                                                                                                                                                                                                                                                                                                         |
| `POST /task`  | `{ task, session_id?, allowed_tools?, max_turns? }` → runs `query({ prompt: task, options: { cwd: '/repo', resume: session_id, permissionMode: 'acceptEdits', allowedTools: ['Read','Edit','Write','Bash','Glob','Grep'], sandbox: { enabled: true, excludedCommands: ['git'] }, mcpServers: { supabase: { type: 'http', url: 'https://mcp.supabase.com/mcp?project_ref=…&read_only=true', headers: { Authorization: 'Bearer <oauth token>' } } }, maxTurns: 30 } })` and streams `SDKMessage`s as SSE. Returns final `session_id`. |
| `POST /diff`  | `git diff base..HEAD --stat` + patch (truncated)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `POST /push`  | commit outstanding changes (author "Supabase Assistant"), `git push -u origin <branch>`                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `GET /health` |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |

The sandbox VM is only reachable from the API worker (bearer `SANDBOX_INTERNAL_SECRET` per VM,
generated at launch). Secrets in the VM: `ANTHROPIC_API_KEY` (or Bedrock creds),
`GITHUB_TOKEN` (installation token), the user's Management API OAuth access token (for
the MCP server; refresh is not done in the sandbox — the API worker re-injects on resume).

**VERIFY:** Claude Agent SDK's bash sandbox on AL2023 inside Firecracker (may need
`enableWeakerNestedSandbox` or to rely on VM isolation and set `sandbox.enabled=false`;
VM isolation is the primary boundary either way). **VERIFY** whether the MicroVM image
build ("Dockerfile → snapshot") needs lifecycle hooks because we `git clone` and open
network connections after start — per AWS docs, apps that establish connections during
init "may need to integrate with service-provided hooks".

### 8.4 Orchestration (API worker side)

```ts
// supabase/workers/api/src/sandbox/provider.ts
export interface SandboxProvider {
  launch(input: {
    imageRef: string
    env: Record<string, string>
    idleSuspendSeconds: number
    maxDurationSeconds: number
  }): Promise<{ providerRef: string; endpointUrl: string }>
  resume(providerRef: string): Promise<void>
  suspend(providerRef: string): Promise<void>
  terminate(providerRef: string): Promise<void>
  status(providerRef: string): Promise<'pending' | 'running' | 'suspended' | 'terminated'>
}
```

- `lambda-microvm-provider.ts`: wraps `run-microvm` / `suspend-microvm` / `resume-microvm` /
  `terminate-microvm` (or the Supabase Workers control API that fronts them — **VERIFY**
  which one the product exposes; write against the interface either way).
- `local-docker-provider.ts`: `docker run -p 0:8080 assistant-sandbox` for local dev.

Lifecycle per conversation: `sandboxes` row keyed by `(conversation_id)`; reuse if
`running|suspended`; `idleSuspendSeconds = 600`, `maxDurationSeconds = 4h`; `pg_cron`
terminates anything idle > 2 h and marks `terminated`.

Streaming into the chat: the `run_coding_task.execute` function opens the SSE from
`POST /task`, and for each `SDKMessage` calls `writer.write({ type: 'data-sandbox', id: <toolCallId>, data: {...} })`
on the UI message stream writer (AI SDK `createUIMessageStream` — switch step 9 in §6.1 to
`createUIMessageStream({ execute: ({ writer }) => writer.merge(result.toUIMessageStream()) })`
so tools can emit data parts). The tool's final output is a compact summary
`{ session_id, files_changed, summary, diff_stat }`, which is what the model sees.

Studio renders `data-sandbox` parts with a new `SandboxRunRenderer` (Phase 4 UI work, the
only genuinely new UI in this plan; model it on `NotebookRunRenderer`).

---

## 9. Studio changes (keep the UI, swap the plumbing)

All in `apps/studio/`. Gate the entire new path behind a feature flag
`assistantSupabaseBackend` (`useFlag`) so it can be rolled out per user and rolled back.

1. **Assistant client** — new `lib/ai/assistant-client.ts`: creates the dedicated
   supabase-js client for the assistant project (`NEXT_PUBLIC_ASSISTANT_SUPABASE_URL`,
   `NEXT_PUBLIC_ASSISTANT_PUBLISHABLE_KEY`, `NEXT_PUBLIC_ASSISTANT_API_URL`), performs
   `POST /auth/exchange` when there is no session, exposes `getAssistantAccessToken()`.
2. **Transport** — in `state/ai-assistant-state.tsx#createChatInstance`, when the flag is on:
   `api: ${ASSISTANT_API_URL}/v1/conversations/${chatId}/chat`, `prepareSendMessagesRequest`
   sends `{ message: last message, trigger, messageId, model, supportMode }` and
   `Authorization: Bearer <assistant jwt>`. Remove `connectionString` from the body.
3. **Persistence** — when the flag is on, the valtio store stops writing chats to IndexedDB
   and instead hydrates from `GET /v1/projects/:ref/conversations` + `GET /v1/conversations/:id`
   (React Query hooks in `data/ai-assistant/*` following `studio-queries` conventions). Chat
   create/rename/delete become mutations. Keep the in-memory valtio shape (`ChatSession`)
   identical so components don't change.
4. **One-time import** — on first run with the flag on, read the IndexedDB store for the
   current `projectRef` and `POST` each chat (`conversations` + `messages` bulk endpoint —
   add `POST /v1/projects/:ref/conversations/import`), then mark imported in localStorage.
5. **OAuth prompt** — handle `409 oauth_required` in the panel with a connect button (§4.2).
6. **New renderer** — `SandboxRunRenderer` for `data-sandbox` parts (Phase 4).
7. Do **not** touch `pages/api/ai/sql/generate-v4.ts` or its route mirror; they remain the
   flag-off and self-hosted path.

---

## 10. Later surfaces (design constraints only, no work in this plan)

- **Slack:** a second worker `supabase/workers/slack` receiving Slack events; "link account"
  = Slack OAuth → `platform_identities` lookup via the same `/auth/exchange` idea but with
  the user completing Supabase OAuth once. Conversations get `surface = 'slack'`, and
  approvals become Slack Block Kit buttons that call `POST /v1/conversations/:id/chat` with
  `trigger: 'approval-response'`. Realtime on `messages` lets Slack and Studio share a thread.
- **MCP server / external agents:** wrap the router with `withOAuthProtectedResource` and
  enable the assistant project's OAuth 2.1 server; nothing in the data model changes.

The v1 contract already supports these because identity is an assistant-project user, the
wire format is the AI SDK UI message stream, and all state is in Postgres.

---

## 11. Phases, deliverables, acceptance criteria

### Phase 0 — Spike (1–2 days)

- Create the assistant Supabase project; register the OAuth App; `supabase link`.
- Scaffold and deploy with the experimental CLI (§3.1), not a hand-rolled example:

  ```bash
  npx --yes supabase@beta experimental workers --help   # re-read; surface is unstable
  npx --yes supabase@beta experimental workers new api --runtime node --size 2gb
  # replace the scaffolded fetch handler with a streaming SSE endpoint
  npx --yes supabase@beta experimental workers push api
  npx --yes supabase@beta experimental workers status api
  ```

- Confirm §3 VERIFY items against that live worker (streaming, timeout, egress,
  `@supabase/server` env auto-resolution, hostname, how secrets are injected).
- Confirm `GET /v1/organizations/{slug}` exposes `opt_in_tags` and which of HIPAA /
  sensitive / entitlement are reachable (§6.4).
- **Exit:** a written checklist of VERIFY outcomes appended to this file under "Phase 0 results".

### Phase 1 — Worker + DB, feature parity, Studio behind flag

- Migrations §5 (identity, oauth, conversations, messages, feedback).
- `/auth/exchange`, `/oauth/*`, `/v1/me`, conversations CRUD, `/v1/conversations/:id/chat`.
- Port §7 (no sandbox tools, no notebooks, reports/incidents only if VERIFY passes).
- Studio §9 items 1–5 behind `assistantSupabaseBackend`.
- Tests: ported `generate-v4.test.ts`; tool-filter tests; RLS tests (a user cannot read
  another's conversation via PostgREST); OAuth state tamper test.
- **Exit:** with the flag on, an internal user can open the panel, connect their org,
  ask "list my tables", approve an `execute_sql`, refresh the page and see the conversation
  restored from the server. Privacy: with org opt-in `disabled`, `list_tables` returns the
  privacy stub message and no schema is sent to the model (assert via Braintrust trace or a
  test double).

### Phase 2 — Hardening

- Rate limiting §6.5, `pg_cron` retention, error taxonomy (`oauth_required`,
  `oauth_expired`, `project_not_in_org`, `rate_limited`), Braintrust parity, alerting on
  worker 5xx. Import of IndexedDB history (§9.4).
- **Exit:** dogfood by the AI team for two weeks with flag on; error rate ≤ old route.

### Phase 3 — Rollout

- Flag to 10% → 50% → 100% of platform users. Keep old route for self-hosted.
- **Exit:** flag removed for platform; old route only compiled when `!IS_PLATFORM` is
  possible (do not delete the file).

### Phase 4 — Sandbox

- GitHub App, `github_installations`, `project_repos`, `sandboxes`; sandbox image;
  `SandboxProvider` with local Docker first, Lambda MicroVM second; `sandbox-tools.ts`;
  `SandboxRunRenderer`.
- **Exit:** from Studio, "add a `posts` table with RLS and generate the migration in my
  repo" produces a branch with a migration file, a visible diff in the chat, and an
  approval-gated PR.

### Phase 5 — Slack / MCP (separate plan)

---

## 12. Open questions and assumptions (resolve in Phase 0)

1. Workers runtime (answer by running `npx --yes supabase@beta experimental workers`, §3.1):
   streaming responses, max request duration, egress allowlist, how secrets are
   injected, public hostname, `config.toml` shape, whether `@supabase/server`
   auto-detects `SUPABASE_URL`/keys. Re-read `--help` at the start of the spike —
   the command is experimental and can change.
2. Platform JWKS URL for verifying Studio's JWT in `/auth/exchange`, and whether platform
   tokens carry `email`.
3. Management API coverage: `opt_in_tags`, HIPAA add-on, `is_sensitive`, entitlements,
   reports, incidents, `database/query` semantics (read-only flag? statement timeout?).
4. Whether `mcp.supabase.com` accepts OAuth App tokens (it accepts PATs and dashboard
   tokens today). If yes, `execute_sql`/`deploy_edge_function` can also go through MCP with
   `read_only=false` while keeping Studio's approval gate.
5. Supabase Workers control plane for launching a _second_ image (sandbox) from the API
   worker — API shape, per-VM secrets, network reachability between VMs.
6. Model provider for the chat loop stays OpenAI (as today). The sandbox uses Anthropic
   (Agent SDK requirement). Confirm key ownership/billing for both.
7. Data residency: conversations now persist server-side. Confirm region for the assistant
   project and whether EU/HIPAA orgs must be excluded from the flag (today's
   `isTracingAllowed` logic is the precedent; propose: exclude HIPAA orgs from Phase 3 until
   reviewed).

---

## 13. Quick reference: key ported types and contracts

- `UIMessage` (from `ai`) with `parts: (TextUIPart | ReasoningUIPart | ToolUIPart | DataUIPart)[]` and
  `metadata?: { containsLogsSnippets?: boolean }` — stored verbatim in `messages.parts` / `messages.metadata`.
- `AiOptInLevel = 'disabled' | 'schema' | 'schema_and_log' | 'schema_and_log_and_data'`.
- `AssistantModelId` and `DEFAULT_ASSISTANT_BASE_MODEL_ID` from `model.utils.ts`.
- Approval protocol: tool parts move `input-available → approval-requested → approval-responded → output-available`;
  client auto-sends when `lastAssistantMessageIsCompleteWithApprovalResponses`.
- Tool categories (`tool-filter.ts`): `UI` (always), `SCHEMA`, `LOG`, `DATA`, plus new `CODE`.

---

## 14. Follow-ups (do later)

Phase 1 must-fixes (composite message PK, OAuth popup completion, `consumeStream` /
`consumeSseStream` so disconnect still persists) are done. Everything below is
known and deferred — do not treat as blockers for the first dogfood flag.

### Should fix

1. **`oauth_expired` in Studio.** `getValidAccessToken` returns 409 `oauth_expired`, but
   the transport and `AssistantChat` only match `oauth_required`. An expired refresh
   shows as a generic error. Handle `oauth_expired` the same way as `oauth_required`
   (reconnect banner).
2. **`execute_sql` always runs with `read_only: false`.** The tool has `isWriteQuery` in
   its input but `managementApi.runQuery` is called without options. Pass
   `{ readOnly: !isWriteQuery }`.
3. **Model entitlement is unchecked.** `/chat` accepts any `isKnownAssistantModelId`,
   including advanced models, because §6.4 (`hasAccessToAdvanceModel`) is not ported.
   Until AI-details exists, restrict to base models server-side.
4. **CORS on router-level errors.** 404/405 from `createRouter` return `jsonError(...)`
   without `withSupabase` CORS, so the browser sees an opaque failure. Attach
   `corsHeaders(request)` to those responses.
5. **`/auth/exchange` race.** Two concurrent first-time exchanges can both miss the
   `platform_identities` row, both `createUser`, and the second insert fails on the PK,
   orphaning an auth user. Catch the conflict and re-read (or take an advisory lock on
   `sub`). Rate-limit this endpoint as §4.1 already asks.
6. **Redundant `updated_at` bumps.** Both `messages_bump_conversation_updated_at` and
   `upsertMessage(s)` update `conversations.updated_at`. Keep the trigger; drop the
   client-side touch.

### Minor

7. **`oauth_connections` select policy exposes `vault_secret_id`.** Harmless (it is only
   an id) but only `org_slug, scopes, expires_at` are needed. Use a view or column grants.
8. **Tests still thin vs §11.** `chat-route.test.ts` covers the router (401/404/405), not
   the ported `generate-v4` assertions (message windowing, approval-response, 409). No
   RLS or OAuth-state tamper tests yet.
9. **Client `messages[]` can overwrite stored parts.** Each send upserts the client's
   window, so a client-sanitized message can replace a richer server copy. Today
   `prepareMessagesForAPI` only strips notebook snapshots. Prefer upserting only the
   latest message on `submit-message` / `approval-response` (§6.1).

### Still deferred from the original phases

- §6.4 AI details / opt-in / HIPAA (`aiOptInLevel` hardcoded).
- §6.5 rate limiting, §5 `pg_cron` retention, Realtime on `messages`.
- §9.4 IndexedDB import.
- Reports tools, notebooks, Braintrust.
- Phase 0 VERIFY checklist on a live `workers push`.

