# LLM / agent content parity and onboarding

Companion to [`llm-agent-surface.md`](./llm-agent-surface.md) (routing and
discovery). This file covers HTML↔markdown fidelity, search caveats, agent
onboarding guides, and known stale wiring.

**Verify against live code** before depending on any path here.

## Two-pipeline parity for embedded content

Content that renders on the HTML page is **not** automatically present
in the `.md` export. Both pipelines must implement the same semantics.

Example: framework quickstart **AI prompt blocks** (see
supabase/supabase#47543). Each quickstart embeds one by ID:

```mdx
<AiPrompt id="flask" />
```

The prompt text lives in `data/ai-prompts.data.ts` (`aiPrompts`, keyed by
`id`); the MDX carries only the ID, following the registry pattern in
[`app-map.md`](./app-map.md). An unknown ID throws at render time.

| Pipeline     | Path                                                                                                                                    |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| **HTML**     | `features/ui/AiPrompt.tsx` looks up the prompt and renders `PromptPanel` (copy + expand)                                                |
| **Markdown** | `internals/markdown-schema/PromptPanel.ts` — handlers for the `PromptPanel` compound parts, registered in `generate-guides-markdown.ts` |

The markdown handlers keep `PromptTitle` (bold) and `PromptContent`, and
drop `PromptCopy` (clipboard-only duplicate). `AiPrompt` itself has no
markdown handler: the HTML wrapper composes the compound children on the
client, so the `.md` export intentionally omits the copy panel.

`$Partial` variable substitution (`lib/partials.utils.ts`, wired in both
`partialsRemark` and `inlinePartials`) is still required for nested
partials; it is not involved in the AI-prompt path.

When adding content aimed at both humans and agents, always verify:

```bash
cd apps/docs && pnpm build:guides-markdown
# then inspect public/markdown/guides/<same-path>.md for **AI Prompt**
```

## Programmatic search

`/docs/api/graphql` exposes `searchDocs`, backed by embeddings generated
offline via `scripts/search/generate-embeddings.ts`. Agents can request
full `content` in results.

**Caveat:** search infrastructure is decoupled from the markdown export
pipeline and is considered fragile. See
[`known-issues.md`](./known-issues.md) "Search infrastructure is
decoupled and considered broken" before building features on top of it.

## Agent onboarding content

First-party guides under `content/guides/ai-tools/`:

| Page             | Purpose                           |
| ---------------- | --------------------------------- |
| `mcp.mdx`        | Supabase MCP server setup         |
| `plugins.mdx`    | One-click MCP + skills bundle     |
| `byo-mcp.mdx`    | Build your own MCP server         |
| `ai-skills.mdx`  | Index of installable agent skills |
| `ai-prompts.mdx` | Curated IDE prompts               |

The skills index is **federated** from `supabase/agent-skills` at
runtime (`AiSkills.utils.ts`). See [`federated-docs.md`](./federated-docs.md).

## In-flux / stale wiring

- `llms-full.txt` fetches reference markdown from
  `${NEXT_PUBLIC_DOCS_URL}/markdown/reference/<slug>.md` at runtime.

## Related

- [`llm-agent-surface.md`](./llm-agent-surface.md) — routing, negotiation,
  entry points, bulk vs per-page retrieval.
- [`app-map.md`](./app-map.md) — two-pipeline model, directory layout.
- [`federated-docs.md`](./federated-docs.md) — agent-skills federation.
- [`known-issues.md`](./known-issues.md) — search fragility, reference
  page length.
