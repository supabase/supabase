# @supabase/agent-runtime

A framework for building agents on **Supabase Workers** with **AI SDK 7**.
`apps/assistant` is the first application; Studio embeds that application through
its versioned HTTP API. This is a private workspace package while its API is dogfooded.

## Getting started

Use Node.js 22.13 or later and the repository's pnpm version. Add the package to
your application's workspace dependencies:

```json
{
  "dependencies": {
    "@supabase/agent-runtime": "workspace:*"
  }
}
```

The package exports TypeScript source for the application's bundler to compile.
It is not published to npm. Its peer dependencies include AI SDK, Supabase server
and client libraries, Hono, and Zod; use the compatible versions in
[`package.json`](./package.json). Choose an AI SDK model provider in your application.

Start with [the complete Worker example](./examples/worker.ts), which combines
Supabase authentication, an agent, a tool, a skill, result-sharing permissions,
and an HTTP streaming response. For persistent conversations and approval
continuations, implement the persistence callbacks described below and follow
[the Assistant application](../../apps/assistant/README.md).

## Public API

| Export                                                     | Purpose                                                                                     |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `defineAgent`                                              | Define instructions, tools, skills, permissions, and per-turn sessions.                     |
| `composeTools`                                             | Combine tool sources with explicit replacement rules.                                       |
| `withToolPolicy`                                           | Apply application permissions to an AI SDK tool set.                                        |
| `sanitizeToolOutputForModel` / `sanitizeToolErrorForModel` | Apply current asynchronous execution and sharing policies to stored tool results/errors.    |
| `sanitizeToolOutput`                                       | Apply synchronous output-sharing projection to stored tool results.                         |
| `reconcileAgentMessages`                                   | Validate browser history and authorize responses to stored approvals.                       |
| `createMcpConnections`                                     | Connect named MCP servers; import from `@supabase/agent-runtime/mcp`.                       |
| `startAgentRun`                                            | Manage a run through application-defined persistence callbacks.                             |
| `createSkillCatalog`                                       | Build a lazy skill loader and its prompt catalog.                                           |
| `createAgentStreamResponse`                                | Stream AI SDK UI messages with persistence and cleanup callbacks.                           |
| `createAgentWorker`                                        | Create authenticated Supabase Worker routes; import from `@supabase/agent-runtime/workers`. |

The remaining exports above come from `@supabase/agent-runtime`.

## Boundaries

```text
Studio (or another integration)
    │ authenticated HTTP + AI SDK UI message stream
    ▼
Supabase Worker — createAgentWorker
    │ verified identity + request-scoped Supabase clients
    ▼
Application — authorization, consent, models, storage configuration
    │ trusted context + canonical messages
    ▼
Agent — defineAgent
    │ instructions + skills + tool policies + MCP connections
    ▼
AI SDK — model loop, tool validation, approvals, streaming
```

The framework provides execution mechanics. Applications define their own tools,
permission vocabulary, prompts, skills, models, data access, and persistence.
The optional `AgentPersistence<Context, State>` contract accepts application callbacks.
The framework defines no tables, SQL, migrations, database drivers, or stored row shapes.
No Studio types, environment variables, consent levels, or product policies live
in this package. There is no filesystem discovery or global request context.

## Define an agent

Use ordinary AI SDK `tool()` definitions with schemas and executors. `defineAgent`
adds a typed application context, bounded loop, optional skill catalog, and optional
permissions. See [the complete, typechecked example](./examples/worker.ts).

```ts
import { defineAgent } from '@supabase/agent-runtime'
import { tool } from 'ai'
import { z } from 'zod'

const agent = defineAgent<{ userId: string }>({
  name: 'account-helper',
  instructions: 'Help the user identify their account.',
  maxSteps: 3,
  permissions: { get_identity: {} },
  tools: ({ userId }) => ({
    tools: {
      get_identity: tool({
        description: 'Get the authenticated user ID.',
        inputSchema: z.object({}),
        execute: async () => ({ userId }),
      }),
    },
  }),
})
```

Define the agent once and call `agent.prepare({ context, abortSignal })` for each
turn. Pass the verified application's context, never a browser-supplied context
object. Context reaches tool factories and message hooks; the framework does not
serialize it into the prompt. `session.stream({ model, messages })` accepts canonical
AI SDK UI messages and returns the AI SDK result. A session runs one turn.

`prepareMessages` filters or redacts history before conversion.
`contextMessages` receives that prepared history and adds application context.
Static instructions and skill descriptions remain separate from these messages.

## Run on Supabase Workers

Import `createAgentWorker` from `@supabase/agent-runtime/workers`. It creates a Hono
application with the Workers `fetch` entry point. Each route declares `auth: 'user'`
or `auth: 'none'`; there is no implicit public route. User routes use
`@supabase/server` JWT verification and receive its typed `SupabaseContext`, including
the user-scoped `supabase` client. RLS applies when that client accesses the database.
The optional `authorize` hook adds application authorization after authentication.

Export the worker from `supabase/workers/api/index.ts` and configure the project:

```toml
[workers.api]
runtime = "node"
size = "2gb"
```

Bundle workspace imports into `supabase/workers/api/index.mjs` for deployment.
Assistant's [build configuration](../../apps/assistant/esbuild.config.mjs) and
[`supabase/config.toml`](../../apps/assistant/supabase/config.toml) are the working
deployment example. Its local Node HTTP adapter propagates client disconnects as
request cancellation. Model providers are selected by the application; this package
does not assume a provider gateway or hosting platform other than Supabase Workers.

Pass Workers secrets explicitly as `env` to `createAgentWorker`, using `url`,
`publishableKeys`, `secretKeys`, and optional `jwks` from `SupabaseEnv`.
Hosted Workers do not inject the assistant project's connection settings. Assistant
maps its `ASSISTANT_*` secrets into this environment; another application can choose
its own prefix. Keep clients and secrets in server context, outside model messages.

The worker supports application middleware for CORS and body limits, custom error
formatting, and normal HTTP routes for history, feedback, settings, or other
integrations. Supabase Auth verification and HTTP errors retain their status codes.

## Application-defined permissions

Permission decisions are independent:

| Concern               | API                                        | Behavior                                                                                                                        |
| --------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| Tool exposure         | `permissions` keys and `visible(context)`  | With a policy map, only listed, visible tools are exposed, including the skill loader. Omit it to retain the provided tool set. |
| Execution             | `canExecute(context, call)`                | Evaluated before every execution; false or a thrown error denies the call.                                                      |
| Approval              | `needsApproval: true` or `(context, call)` | Adds an AI SDK approval requirement. A policy cannot remove an intrinsic requirement.                                           |
| Model visibility      | `modelOutput(output, context, call)`       | Projects results before model conversion, preserving full results for the authorized UI.                                        |
| Historical visibility | `sanitizeToolOutput`                       | Applies the same projection to stored output; unknown tools are redacted by default.                                            |

`call` contains the tool `name`, `input`, and `toolCallId`. Visibility is synchronous
and evaluated when preparing the tool set; execution and approval predicates may
be asynchronous. Execution checks run again after an approval continuation.
Execution or visibility errors deny access; approval-policy errors require approval.
`modelOutput` is synchronous and runs before model conversion.
Use `modelError(error, context, call)` to redact execution errors before the SDK
uses their text in subsequent model steps. It also applies to historical errors
through `defineAgent`. A failed error formatter produces a generic error; a
formatted error has no original cause. Error projection affects the UI error text
as well because the SDK shares the same tool error between model and UI. Its output does not
replace the result stored for the authorized UI.

All of these policies belong to application code. For example, an application may
allow a user to approve SQL execution while withholding rows from the model.
Assistant defines that policy in
[`tool-policies.ts`](../../apps/assistant/supabase/workers/api/src/ai/tools/tool-policies.ts).
Execution permission and data sharing permission are separate; a policy using
`canExecute` should also define `modelOutput` when historical results are sensitive.

Use `withToolPolicy(tools, { context, policies })` for independently composed tool
sources such as MCP discovery. This is the same enforcement used by agent-level
`permissions`. Dynamic tool identity is preserved. Unknown remote tools never gain
access just because the remote server adds them. Policy-denied results bypass the
original output converter; permission errors fail closed.

`composeTools` rejects collisions among base tools and extensions. Replacements
must be explicit in `overrides`, so a remote tool cannot silently replace an
application's approval-gated executor. Provider-executed tools cannot use local
execution guards; the framework rejects that combination. Executors returning
async iterables are reduced to their final result under a permission wrapper.

Agent-level `permissions` also project historical results for removed tools and
redact unknown ones, including asynchronous execution checks when a tool disappears.
When using `withToolPolicy` independently, use `sanitizeToolOutputForModel` and
`sanitizeToolErrorForModel` on stored parts before restoring history; AI SDK cannot apply a missing tool's converter. Assistant's
[`tool-sanitizer.ts`](../../apps/assistant/supabase/workers/api/src/ai/tools/tool-sanitizer.ts)
demonstrates consent downgrades for static and dynamic results.

AI SDK approval requests pause a turn; they do not authenticate the approval.
Use `reconcileAgentMessages` inside the same transaction that claims the next run:

```ts
const messages = await reconcileAgentMessages(previous, incoming, {
  trigger: 'approval-response',
  context: { responderId, ownerId, allowedTools },
  canRespondToApproval: (context, decision) =>
    context.responderId === context.ownerId && context.allowedTools.includes(decision.toolName),
})
```

The callback receives the stored message ID, approval ID, tool name, call ID and
input, together with the validated `approved` choice and optional reason. The
helper rejects changed tool inputs, forged assistant messages, changed metadata,
and replaced approval IDs before calling the policy. It passes a clone to the
policy, so a callback cannot rewrite the stored call. A denied or failed policy
throws `AgentApprovalAuthorizationError`. Without a responder callback, the
caller must still enforce session ownership; Assistant does so in its storage callbacks.

## MCP connections

Import `createMcpConnections` from `@supabase/agent-runtime/mcp`. A definition
resolves its HTTP or SSE transport from trusted context each time it is opened.
Keep OAuth acquisition, refresh and credential storage in your application:

```ts
const connections = await createMcpConnections(
  [
    {
      name: 'documents',
      transport: async ({ userId }) => ({
        type: 'http',
        url: 'https://documents.example/mcp',
        headers: { Authorization: `Bearer ${await getAccessToken(userId)}` },
      }),
      allowlist: ['search', 'read'],
      aliases: { search: 'search_documents' },
      failure: 'required',
    },
  ],
  { context: { userId }, abortSignal }
)
```

This exposes `search_documents` and `documents__read`. Unaliased tools receive
`<connection name>__<remote tool name>`; `namespace` overrides that prefix.
Compose `connections.tools` with local tools and return `connections.close` from
the agent's tool factory. Apply the agent's permission map to the exposed names.
Assistant uses aliases to preserve its Studio tool renderer contract.

Names and aliases must be unique. Unknown tools are excluded when `allowlist` is
provided. Connections default to required; optional discovery failures omit that
connection and call `onError`. Authentication failures always reject, allowing the
application to request reconnection. `McpConnectionError` supplies stable codes
and connection/tool names without upstream URLs, credentials, or response bodies.
The framework recognizes authorization failures during discovery and execution.
MCP tool results with `isError: true` remain ordinary tool results and also notify
`onError`; applications may interpret their domain-specific contents.

Clients belong to one prepared turn, use fresh credentials, and close on abort,
setup failure, or explicit cleanup. Partial startup closes already-open clients.
HTTP requests have a bounded timeout (`requestTimeoutMs`, default 30 seconds).
Execution is never automatically retried. HTTP and SSE are explicit choices;
there is no stdio transport, OAuth UI, MCP resource/prompt adapter, or shared
cross-user discovery cache.

## Skills

Each skill has `name`, `description`, and a `load()` callback. Only names and
descriptions enter system instructions. `load_skill({ name })` loads the selected
registered skill on demand; it cannot read arbitrary paths. The catalog validates
names and duplicates and does not cache loaded content between requests.

`skillToolName` adapts the loader to an integration's contract. Assistant uses
`load_knowledge` so its existing Studio tool renderer continues to work.
Skills supply guidance; tool permissions remain authoritative.

## Streaming and persistence

`createAgentStreamResponse` adapts the AI SDK result to its UI message SSE protocol.
Pass `onFinish` to persist the final message and `onSettled` to release a claimed
turn and close the session. Both callbacks receive `status` (`completed`, `failed`,
or `cancelled`). Settlement runs once, including when persistence fails. It waits for those operations before sending the final
event, and consumes the response stream after a browser disconnect so persistence
can finish. The default error formatter withholds internal error details.

Tool resources close once on explicit `session.close()`, cancellation, or preparation
failure. Factories must clean up partial resources if discovery itself throws.
After a successful stream starts, the transport owns settlement; do not close in a
route's unconditional `finally` before the response body has finished. Always close
if response setup throws. Persistence operations should be idempotent so application cleanup paths may safely
settle an already-finished run.

## Application-owned persistence

`AgentPersistence<Context, State>` and `startAgentRun` are available from the main
export and `@supabase/agent-runtime/persistence`. Persistence has three callbacks:

| Callback                                 | Responsibility                                                                                      |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `startRun(context, input)`               | Authorize and claim a run, reconcile incoming messages, and return canonical `{ messages, state }`. |
| `finishRun(context, state, outcome)`     | Save the response and status and release the run claim.                                             |
| `executeTool(context, state, operation)` | Optionally deduplicate a tool operation before invoking `operation.execute()`.                      |

`Context` and `State` are application-defined types. You can use your own identity
model, session identifiers, revisions, schema, and transaction implementation.
Neither object is serialized into model messages. There is no required Postgres
schema or `user_id`, `session_id`, or `revision` column in the framework.

```ts
import { startAgentRun, type AgentPersistence } from '@supabase/agent-runtime'

const persistence: AgentPersistence<RequestContext, SavedRun> = {
  startRun: (context, { messages, trigger }) =>
    conversations.claimAndLoad(context, messages, trigger),
  finishRun: (context, state, outcome) => conversations.saveAndRelease(context, state, outcome),
  executeTool: (context, state, operation) => operations.executeOnce(context, state, operation),
}

const run = await startAgentRun({ persistence, context, messages, trigger })
const result = await session.stream({ model, messages: run.messages })

return createAgentStreamResponse(result, {
  originalMessages: run.messages,
  onFinish: ({ responseMessage, status }) => run.finish({ responseMessage, status }),
  onSettled: async ({ status }) => {
    try {
      await run.finish({ status })
    } finally {
      await session.close()
    }
  },
})
```

The application methods in this example own persistence. `startAgentRun` awaits
the start callback before returning canonical history. `run.state` holds the
returned application state, such as a revision for an integration response header.
Wire tool execution through `run.executeTool({ name, toolCallId, input, execute })`
when using the execution callback. Without that callback, `run.executeTool` rejects;
the framework never silently executes an unclaimed operation.

Concurrent calls to `run.finish` share the first in-flight save. After a successful
save, later calls do nothing. If saving the response fails, a later call may settle
the run as failed. Tool execution is prohibited once finishing begins, including
when a save failed. Close the prepared session if startup or stream setup throws;
the complete application integration handles these failure paths.

These are awaited persistence operations. Implement `startRun` as one atomic
claim/history transaction, and `finishRun` as a fenced, idempotent save/release
transaction. Keep authorization and approval-response reconciliation within that
boundary. A logging or analytics event listener does not provide these guarantees.
The execution callback must persist its claim before calling an external service,
validate cached tool name and input, and reject retries whose outcome is uncertain.
Callbacks choose the storage system; the framework cannot supply cross-system
exactly-once execution or automatic model resumption after a Worker restart.

### Assistant's Supabase implementation

Assistant implements the callbacks in
[`db/agent-persistence.ts`](../../apps/assistant/supabase/workers/api/src/db/agent-persistence.ts).
Its [Postgres adapter](../../apps/assistant/supabase/workers/api/src/db/postgres-session-store.ts),
[table configuration](../../apps/assistant/supabase/workers/api/src/db/session-store.ts),
and [declarative schemas](../../apps/assistant/supabase/schemas) all belong to the
application. Supabase Workers provide the authenticated runtime; Assistant supplies
the database connection and transactions.

That adapter preserves session ownership, stale-revision rejection, canonical
approval decisions, durable operation claims, and ordered run events. Assistant's
HTTP API supplies session CRUD and cursor-based event replay. Another application
can implement the same callbacks over different tables or a different storage
service without adopting Assistant's schema or API routes.

## Validation

```sh
pnpm --filter @supabase/agent-runtime typecheck
pnpm --filter @supabase/agent-runtime lint
pnpm --filter @supabase/agent-runtime test
pnpm --filter assistant test
pnpm --filter assistant build
```

The package tests exercise real AI SDK loops and approval requests, real Supabase
JWT verification, tool policies, lazy skills, cancellation, and persistence ordering.
Assistant maintains its independent Studio wire fixtures and database security tests.
