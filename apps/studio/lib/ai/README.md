# Supabase Assistant code guide

Start here when working on the Assistant in Studio. This guide maps the implementation for contributors and coding agents. Follow [Studio's agent instructions](../../AGENTS.md) and load the skills that apply to your change.

## Request flow

```mermaid
flowchart TD
  UI[AssistantChat] --> State[ai-assistant-state: chat transport]
  State --> API[POST /api/ai/sql/generate-v4]
  API --> Access[Resolve organization access and model]
  Access --> Tools[getTools]
  Tools --> Response[generateAssistantResponse]
  Response --> Stream[Stream messages and tool calls to the UI]
  Stream --> Parts[Message.Parts: render text and tool cards]
  Parts --> Approval[User approves a tool when required]
  Approval --> State
```

The [sidebar provider](../../components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider.tsx) mounts [AIAssistant](../../components/ui/AIAssistantPanel/AIAssistant.tsx). [AssistantChat](../../components/ui/AIAssistantPanel/AssistantChat.tsx) manages the active conversation UI and supplies project and organization context to [ai-assistant-state](../../state/ai-assistant-state.tsx).

The state module owns the AI SDK chat instances, request transport, chat persistence, and approval continuation. Its transport sends messages to [generate-v4](../../pages/api/ai/sql/generate-v4.ts), which validates and authenticates the request, resolves access and the model, builds tools, and streams the response. The [TanStack route](../../routes/api/ai/sql/generate-v4.ts) adapts this same handler. Keep both runtimes in mind; see the [migration guide](../../TANSTACK_MIGRATION.md).

[generateAssistantResponse](./generate-assistant-response.ts) combines prompts, context, prepared conversation history, and tools for the model. [Message.Parts](../../components/ui/AIAssistantPanel/Message.Parts.tsx) dispatches streamed message parts to their UI renderers. Approval responses travel back through the chat transport so the server can continue tool execution.

## Rules to keep

- **Enforce access in code.** Resolve organization/project access on the server and keep the restrictive fallback for an unverified pairing. Prompts and UI visibility are not authorization checks.
- **Keep execution approval separate from data sharing.** Full data opt-in does not approve AI-generated SQL execution. Promote untrusted SQL only after explicit user approval.
- **Protect results on every model path.** Apply output filtering to both live tool results and replayed history. Raising opt-in must not expose SQL results collected under a lower level.
- **Keep the tool allowlist.** Register tools explicitly and declare their minimum opt-in level. Remote MCP tools must pass the filter; the remote server's read-only setting does not replace it.
- **Keep request context out of the shared system prompt.** Put project, chat, clock, and current opt-in information in `assistant-context.ts` to preserve provider caching.
- **Keep tool contracts safe to import in the browser.** Shared contracts contain schemas and pure output transformations; database calls and other server execution belong in the server implementation.
- **Preserve both runtimes.** Keep the TanStack adapter and Next.js handler aligned. The chat route currently delegates to the shared handler; do not remove that handler while the adapter uses it.

## Where to make changes

### Chat and rendering

| Change                                                 | Start here                                                                                                                                                                             |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Panel layout, chat selection, and header               | [AIAssistant.tsx](../../components/ui/AIAssistantPanel/AIAssistant.tsx), [AIAssistantHeader.tsx](../../components/ui/AIAssistantPanel/AIAssistantHeader.tsx)                           |
| Composer, attachments, and sending messages            | [AssistantChat.tsx](../../components/ui/AIAssistantPanel/AssistantChat.tsx), [AssistantChatForm.tsx](../../components/ui/AIAssistantPanel/AssistantChatForm.tsx)                       |
| Chat state, persistence, transport, and selected model | [ai-assistant-state.tsx](../../state/ai-assistant-state.tsx)                                                                                                                           |
| Message rendering and tool-specific cards              | [Message.Parts.tsx](../../components/ui/AIAssistantPanel/Message.Parts.tsx), [Message.Parts.utils.ts](../../components/ui/AIAssistantPanel/Message.Parts.utils.ts)                     |
| SQL results and charts                                 | [AssistantQueryCell.tsx](../../components/ui/AIAssistantPanel/AssistantQueryCell.tsx), [AssistantQueryCell.utils.ts](../../components/ui/AIAssistantPanel/AssistantQueryCell.utils.ts) |
| Approval UI                                            | [Confirm.tsx](../../components/ui/AIAssistantPanel/Confirm.tsx), [Confirm.utils.ts](../../components/ui/AIAssistantPanel/Confirm.utils.ts)                                             |

### Model requests and context

| Change                                               | Start here                                                                                                                                                                              |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Chat endpoint and request validation                 | [generate-v4.ts](../../pages/api/ai/sql/generate-v4.ts)                                                                                                                                 |
| Model streaming and response orchestration           | [generate-assistant-response.ts](./generate-assistant-response.ts)                                                                                                                      |
| System instructions and topic knowledge              | [prompts.ts](./prompts.ts); `load_knowledge` in [studio-tools.ts](./tools/studio-tools.ts)                                                                                              |
| Project, chat, opt-in level, clock, and logs context | [assistant-context.ts](./assistant-context.ts), [assistant-message-metadata.ts](./assistant-message-metadata.ts)                                                                        |
| History preparation and output sanitization          | [generate-assistant-response.utils.ts](./generate-assistant-response.utils.ts), [tool-sanitizer.ts](./tools/tool-sanitizer.ts)                                                          |
| Model catalog, defaults, and provider configuration  | [model.utils.ts](./model.utils.ts), [model.ts](./model.ts), [bedrock.ts](./bedrock.ts); entitlement and throttling decisions in [generate-v4.ts](../../pages/api/ai/sql/generate-v4.ts) |
| Tracing and feedback                                 | [braintrust-logger.ts](./braintrust-logger.ts), [feedback API](../../pages/api/ai/feedback/), [rate-message-mutation.ts](../../data/ai/rate-message-mutation.ts)                        |

Keep per-request context in `assistant-context.ts`. The shared system prompt is deliberately static for provider caching.

### Tools

| Change                                                                                 | Start here                                                                                                                                                                               |
| -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tool assembly and platform/self-hosted selection                                       | [tools/index.ts](./tools/index.ts)                                                                                                                                                       |
| Allowlist, minimum opt-in levels, and blocked-tool responses                           | [tool-filter.ts](./tool-filter.ts)                                                                                                                                                       |
| SQL execution, Edge Function deployment, chat renaming, knowledge, and opt-in requests | [studio-tools.ts](./tools/studio-tools.ts)                                                                                                                                               |
| Remote MCP connection and tool selection                                               | [supabase-mcp.ts](./supabase-mcp.ts), [mcp-tools.ts](./tools/mcp-tools.ts)                                                                                                               |
| Schema and policy tools                                                                | [schema-tools.ts](./tools/schema-tools.ts)                                                                                                                                               |
| Reports, notebooks, incidents, and support                                             | [report-tools.ts](./tools/report-tools.ts), [notebook-tools.ts](./tools/notebook-tools.ts), [incident-tools.ts](./tools/incident-tools.ts), [support-tools.ts](./tools/support-tools.ts) |
| Self-hosted tools                                                                      | [fallback-tools.ts](./tools/fallback-tools.ts)                                                                                                                                           |
| Shared tool contracts                                                                  | [types.ts](./tools/types.ts), [registry.ts](./tools/registry.ts), [tool-from-contract.ts](./tools/tool-from-contract.ts)                                                                 |

Some tools use shared contracts; others declare their schemas and output handling directly. [update-notebook.ts](./tools/update-notebook.ts) and [update-notebook.server.ts](./tools/update-notebook.server.ts) show the contract/server split. Contracts define input/output schemas, minimum opt-in level, approval requirements, and what the model may see. The registry also applies contract output handling when replaying history.

For a new or changed tool:

1. Implement it in the appropriate tool module and include it in `getTools`.
2. Update the allowlist/validation in `tool-filter.ts`. Declare minimum access in its contract or the existing category map, as applicable.
3. Decide whether execution needs user approval and what output may reach the model, including on history replay. Read the [SQL safety skill](../../../../.agents/skills/safe-sql-execution/SKILL.md) before changing SQL execution.
4. Update `Message.Parts.tsx` and its helpers if the tool needs a UI renderer.
5. Update relevant tests, mock tools, and evaluation cases. See [local development and validation](#local-development-and-validation).

## Access and data sharing

These checks have different responsibilities:

| Responsibility                                              | Implementation                                                                                                                                                                                                                     |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Resolve the saved organization opt-in tags for the UI       | [useOrgOptedIntoAi.ts](../../hooks/misc/useOrgOptedIntoAi.ts)                                                                                                                                                                      |
| Resolve server-side access for an organization/project pair | [ai-details.ts](./ai-details.ts)                                                                                                                                                                                                   |
| Check permission to change organization settings            | [useCheckPermissions.ts](../../hooks/misc/useCheckPermissions.ts), used by [OptInRequest.tsx](../../components/ui/AIAssistantPanel/OptInRequest.tsx) and [AIOptInModal.tsx](../../components/ui/AIAssistantPanel/AIOptInModal.tsx) |
| Save organization opt-in settings                           | [useAIOptInForm.ts](../../hooks/forms/useAIOptInForm.ts), [DataPrivacyForm.tsx](../../components/interfaces/Organization/GeneralSettings/DataPrivacyForm.tsx)                                                                      |
| Gate tool availability by opt-in level                      | [tool-filter.ts](./tool-filter.ts)                                                                                                                                                                                                 |
| Approve SQL execution and call the database                 | `execute_sql` in [studio-tools.ts](./tools/studio-tools.ts), using [execute-sql-mutation.ts](../../data/sql/execute-sql-mutation.ts)                                                                                               |
| Control which SQL results reach the model                   | `toModelOutput` in [studio-tools.ts](./tools/studio-tools.ts) and history sanitization in [tool-sanitizer.ts](./tools/tool-sanitizer.ts)                                                                                           |

The opt-in levels are `disabled`, `schema`, `schema_and_log`, and `schema_and_log_and_data`. `execute_sql` is available at every level and requires user approval; sharing its result rows with the model requires `schema_and_log_and_data`. History sanitization also considers the level stamped on the original SQL output. Permission to change opt-in settings, user approval to run SQL, and the database's authorization checks are separate from result sharing.

The per-request context states the current level. The model can call `update_opt_in_level` with `requiredLevel` to request higher access, or without `requiredLevel` when the user asks to review or change the setting. Calls without `requiredLevel` require approval through the opt-in request card, including when the organization already has full access. Only a call with an explicit `requiredLevel` already satisfied by `levelWhenAsked` skips approval and shows no card; an unchanged level alone does not bypass approval.

On platform, the endpoint resolves organization access and `getTools` includes platform tools when an access token is available. It also registers the opt-in request tool. Self-hosted requests use the `schema` level and fallback tools instead of the platform tool set. Check [getTools](./tools/index.ts) and [generate-v4](../../pages/api/ai/sql/generate-v4.ts) when changing either environment.

## Related AI features

The chat Assistant shares code with other Studio AI features, but those have separate endpoints:

- [pages/api/ai/sql/](../../pages/api/ai/sql/) contains policy generation, SQL title, filter, and cron helpers alongside the chat endpoint.
- [pages/api/ai/code/complete.ts](../../pages/api/ai/code/complete.ts) handles code completions.
- [pages/api/ai/onboarding/design.ts](../../pages/api/ai/onboarding/design.ts) handles onboarding design.
- [data/ai/](../../data/ai/) contains client queries and mutations for AI helpers and feedback. The chat transport itself lives in `ai-assistant-state.tsx`.
- [routes/api/ai/](../../routes/api/ai/) contains the corresponding TanStack API adapters.

## Local development and validation

Use the [Studio setup instructions](../../README.md#developer-quickstart) for the application and backend configuration. From the repository root, `pnpm dev:studio` starts Studio on port 8082 by default. The chat endpoint currently selects the OpenAI provider, which requires a server-side `OPENAI_API_KEY`; see [model.ts](./model.ts). A self-hosted session exercises the fallback tool set, so use a platform development environment when working on platform-only tools or organization settings.

Tests are colocated with the implementation under `lib/ai/`, `components/ui/AIAssistantPanel/`, and `state/`. For example, from `apps/studio`:

```bash
pnpm exec vitest run lib/ai/tool-filter.test.ts lib/ai/tools/studio-tools.test.ts
```

Use the [Assistant evaluation guide](../../evals/README.md) for behavioral datasets, local evaluation commands, CI labels, and scoring. [dataset.ts](../../evals/dataset.ts) contains scenarios and [mock-tools.ts](./tools/mock-tools.ts) supplies tool behavior for evaluations. The browser test is [assistant.spec.ts](../../../../e2e/studio/features/assistant.spec.ts); read the [E2E setup guide](../../../../e2e/studio/README.md) before running it.

Update this map when moving entry points or changing the request/tool lifecycle.
