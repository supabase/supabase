# Docs AI Sidebar — Take-Home Task 1

Stripe-inspired contextual AI for Supabase documentation. Click the sparkle icon on any code block to open a right-side panel with Supabase AI, the snippet attached as context, and a **Copy context** export for Claude Code, Cursor, or Codex.

**Demo focus:** [Realtime Broadcast guide](https://supabase.com/docs/guides/realtime/broadcast)

## What changed

### Code block AI button
Every Shiki code block (MDX guides) and `ui-patterns` CodeBlock (via `DocsCodeBlock`) now has an **Explain using AI** sparkle button alongside copy and word-wrap controls.

### Right-side AI panel
- Opens from code blocks (not from cmd+k — that flow is unchanged)
- Shows a context pill (`javascript, 12 lines`) and code preview card
- Streams answers from the existing RAG endpoint (`POST /docs/api/ai/docs`)
- Collapsible **Searching docs...** indicator during retrieval
- **Copy context** button exports page URL, snippet, and conversation as markdown

### Layout
Main content narrows when the sidebar is open on desktop (`--docs-ai-sidebar-width` CSS variable). Mobile uses a full-height Sheet overlay.

## Why these decisions

| Decision | Rationale |
|----------|-----------|
| Sidebar over modal for code blocks | Keeps the doc visible while asking questions — matches Stripe's builder-first pattern |
| Reuse `useAiChat` + `clippy()` | Same RAG pipeline as cmd+k AI; no new backend work for v1 |
| Lightweight reasoning UI vs AI SDK Elements | Docs AI does RAG retrieval, not chain-of-thought tokens — custom indicator is honest and avoids new deps |
| Realtime for demo | Rich multi-language tabbed examples; active builder audience |
| Copy context export | Bridges in-docs AI and in-editor agents (Cursor, Claude Code, Context7 MCP) |

## Architecture

```
CodeBlockControls → CodeBlockAiButton → DocsAiSidebarProvider
                                              ↓
                                        DocsAiSidebar (desktop fixed / mobile Sheet)
                                              ↓
                                        useAiChat → /docs/api/ai/docs → clippy()
```

Key files:
- `apps/docs/features/ai-sidebar/` — provider, sidebar UI, export formatter
- `apps/docs/features/ui/CodeBlock/CodeBlock.client.tsx` — toolbar AI button
- `apps/docs/features/app.providers.tsx` — global provider mount

## Context7

[Context7](https://context7.com/) injects up-to-date library docs into AI coding assistants via MCP. Supabase is indexed as `/supabase/supabase`.

| Surface | When to use |
|---------|-------------|
| **Docs AI sidebar** | Reading docs; explaining a specific snippet on a page |
| **Context7 MCP** | Writing code in your editor; version-specific API lookup |
| **Copy context** | Hand off sidebar conversation + snippet to an external agent |

**Prepared for Context7:**
- Added [`public/llms.txt`](../../public/llms.txt) — curated doc index for LLM crawlers
- Existing [agent skills](https://supabase.com/docs/guides/ai-tools/ai-skills) and [`.well-known/agent-skills`](https://supabase.com/.well-known/agent-skills/index.json) on www

**Production follow-ups:**
- Claim `/supabase/supabase` on Context7 and enable [GitHub Actions refresh](https://context7.com/docs/integrations/github-actions.md)
- Optional Context7 [chat widget](https://context7.com/docs/howto/chat-widget.md) for library owners

## How AI tools were used

- **Cursor** — codebase exploration, plan generation, implementation
- **Existing Supabase RAG** — no custom LLM backend; reused `packages/ai-commands` and `useAiChat`

## Run locally

```bash
# From repo root
pnpm install
cd apps/docs
pnpm dev
```

Open `/guides/realtime/broadcast`, hover a code block, click the sparkle icon.

Requires env vars for AI chat (`OPENAI_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).

## Deploy

Deploy `apps/docs` to Vercel with the same environment variables as production docs.

## What we cut (scope)

- Full AI SDK / Elements migration
- Resizable sidebar panel
- Shared chat component extraction from `DocsAiPage` (duplicated render logic in sidebar for speed)
- Context7 GitHub Action (documented as follow-up)

## Test checklist

- [ ] Sparkle on Realtime guide code blocks (including tabbed language panels)
- [ ] Sidebar opens with correct language + line count
- [ ] Dismiss context pill removes preview, keeps chat
- [ ] Streaming markdown + source links
- [ ] cmd+k Ask Supabase AI unchanged
- [ ] Copy context produces valid markdown
- [ ] Mobile Sheet works
