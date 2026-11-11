import { z } from 'zod'

import { renderPageInputSchema } from './generated-page-schema'
import type { ToolContract } from './types'
import { GENERATED_PAGE_COLOR_TOKENS } from '@/components/interfaces/Explorer/GeneratedPage/generated-page-theme'

/**
 * `render_page` — the assistant proposes an interactive HTML page; Studio renders it.
 *
 * Unlike every other tool, this one does no work on the server. It exists purely to carry a
 * validated proposal to the client: the page's markup plus the closed set of queries it is
 * allowed to run. The client shows that proposal for approval, and only the user's approval
 * click promotes each query's SQL and starts the sandboxed iframe (see `GeneratedPageRenderer`).
 *
 * The output is therefore `{ status: 'ready' }` and nothing else. Query results live in the
 * browser for as long as the page is mounted; they never enter the tool output, the message
 * history, or the model's context.
 */
const outputSchema = z.object({ status: z.literal('ready') })

export const contract = {
  name: 'render_page',
  description:
    'Asks the user to run an interactive page you have written — self-contained HTML, CSS, and JavaScript — directly in the chat. The page runs in a sandboxed frame and may only execute the database and logs queries you declare here, addressed by id. Requires user approval before it renders. Query results stay in the browser and are never returned to you, so use this to build something the user reads and interacts with, not to gather data for yourself.',
  inputSchema: renderPageInputSchema,
  outputSchema,
  minOptInLevel: 'schema',
  availability: {
    environments: new Set(['platform']),
    requires: new Set(['explorer']),
  },
  needsApproval: true,
  promptGuidance: `Use \`render_page\` when the user wants something to look at and interact with — a dashboard, a console, an explorer, a debugging surface — rather than a single answer. Use \`execute_sql\` for one-off questions and \`create_notebook\` for a saved investigation.

You never see what the page returns. Query results stay in the user's browser, so never call \`render_page\` to read data for yourself, and never promise to analyze what the page shows.

#### The frame
The page runs in a sandboxed iframe inside the dashboard. \`html\` is the page body: markup plus your own inline \`<style>\` and \`<script>\`. The frame blocks external stylesheets, scripts, fonts, images, and your own \`fetch\` calls. There is no React, no Tailwind, and no component library — write plain HTML, CSS, and JavaScript.

The frame provides exactly three things:
- **\`window.studio\`** — runs the queries you declared. Start your script with \`window.studio.onReady(async () => { ... })\`, then call \`await window.studio.database.query('<id>')\` or \`await window.studio.logs.query('<id>')\`. Each resolves to an array of row objects or rejects with an \`Error\`.
- **\`window.supabase\`** — a \`supabase-js\` client using the project's publishable key, installed only when \`enable_supabase_client\` is true. It may still be missing (no permission, or no key), so guard with \`if (!window.supabase)\` and show a short explanation.
- **Studio's color tokens** as CSS variables on \`:root\`, following the user's light or dark theme. They are listed below.

The frame sizes itself to the page's height, so lay the page out top to bottom and let it grow. Keep the page short by paginating long lists rather than by making the page scroll inside a fixed box. Uncaught errors show in a banner at the top of the page.

Inline scripts are classic scripts, not modules, so there is no top-level \`await\` — do async work inside \`onReady\`. Every inline script is compiled before the page is shown, and a syntax error rejects the call. The user can send you the errors a running page hits, including failed queries. When they do, find the cause and call \`render_page\` again with the whole corrected page.

#### Where the data comes from
- **Declared database queries — the default.** They run through Studio's own connection, bypass Row Level Security, and return the project's real data. Use them for anything like "list, show, chart, or count X" over application tables.
- **Declared logs queries** are for service telemetry: requests, errors, auth events, function invocations.
- **\`window.supabase\`** is for pages about client behavior: signing in, Realtime, Storage, Edge Functions, or showing what an anonymous visitor can read. It runs as \`anon\`, so a table without a matching RLS policy returns no rows — that is RLS working, not a broken client. When a declared query would also work, use the declared query.

#### Declaring queries
- Declare every query in \`database_queries\` or \`log_queries\` with an id unique across both lists. The page can only name ids — it can never send SQL of its own.
- Queries take no parameters. Fetch one bounded set and do search, sorting, filtering, and pagination in JavaScript over the rows you already have.
- Database queries are read-only. Give each a \`row_limit\` (1–1000) sized to what the page shows. Call \`list_tables\` first and only query tables and columns you have seen.
- Logs queries run on ClickHouse and carry their own \`time_range\`. Each one must filter by \`source\` (\`where source = 'edge_logs'\`, or \`source in (...)\`) and include a \`limit\`.
- At most 10 of each kind. Prefer a few aggregate queries over many narrow ones; the user approves the whole set at once.

#### Design
The page sits inside Supabase Studio and should look like part of it: quiet, flat, and dense, the way a well-made admin tool looks.
- **Color:** use only the tokens below, via \`var(--token)\`. No hex, rgb, or named colors. Make tinted backgrounds with \`color-mix(in oklab, var(--destructive) 10%, transparent)\`. For chart series, use \`--primary-bright\`, \`--info\`, \`--warning\`, \`--destructive\`, and \`--muted-foreground\`.
- **Type:** set \`font-family: system-ui, sans-serif\` on \`body\` and \`ui-monospace, monospace\` for code and ids. Use 13px for most text, including tables and controls, 12px in \`--muted-foreground\` for secondary text, and 15px semibold for section headings. Use one larger size, at most 22px, for a page title or the single figure the page leads with. The heaviest weight is 600. No uppercase letter-spaced labels.
- **Layout:** lead with what the user asked about. Group with spacing before borders. Use \`--card\` with a 1px \`--border\` and a 6px radius only where a group must read as one unit, and never nest one inside another. No shadows, gradients, or decorative icons. Leave 24px between sections and 8–12px inside them.
- **Tables:** render tabular data in a real \`<table>\`, with 1px \`--border\` row dividers, headers in \`--muted-foreground\`, numbers right-aligned with \`font-variant-numeric: tabular-nums\`, and a wrapper with \`overflow-x: auto\`. Format timestamps as readable local dates, and truncate long values rather than letting them set the column width.
- **Long lists:** never render every row at once. Paginate any list or table longer than about 25 rows, with previous and next controls and a count such as "1–25 of 312", in JavaScript over the rows you already fetched. A list inside a card gets a \`max-height\` of about 400px with \`overflow-y: auto\`, so the card stays compact next to its neighbors.
- **Controls:** buttons and inputs are 28–32px tall, with a 6px radius, a 1px \`--input\` border, and a \`--control\` or \`--field\` background. Only one \`--primary-solid\` button per page. Give focused elements a visible \`outline: 2px solid var(--ring)\`.
- **States:** every region that depends on a query shows a loading state, an error state with the error message you received plus a retry control, and an empty state that says what would appear. Keep "unavailable", "failed", and "no rows" distinct.
- **Copy:** sentence case, plain words, with units and time ranges on every figure. Skip a title or description that only restates what the content already shows.

If the user asks for a different look, follow their request instead of these defaults, but keep the data rules above.

#### Color tokens
${GENERATED_PAGE_COLOR_TOKENS.map(({ name, use }) => `- \`${name}\` — ${use}`).join('\n')}`,
  toModelOutput: ({ status }) => ({ status }),
} as const satisfies ToolContract
