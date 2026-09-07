# MCP interstitials

Standalone pages under `/mcp/*` that the hosted MCP server links a user to
when a tool call needs something only the user can give it — a secret to
store, a cost to confirm, a scope to consent to. The user arrives from their
AI client, does one thing, and goes back.

Served under Studio's base path, so the real URL is
`https://supabase.com/dashboard/mcp/<name>`.

## What lives here

`InterstitialShell.tsx` and `InterstitialTerminalScreen.tsx` are shared by
every interstitial:

- **`InterstitialShell`** — the no-chrome standalone layout: centered 400px
  card, Supabase logo header, title and subtitle slots.
- **`InterstitialShellSkeleton`** — the same header, skeletonized, with a slot
  for your own body skeleton so the card doesn't resize when real content
  lands.
- **`InterstitialFooter`** — small print at the bottom of a card.
- **`InterstitialTerminalScreen`** — the end state: title, subtitle, next-step
  callout, footer. Takes copy, not state, so each interstitial maps its own
  state union to `InterstitialTerminalCopy` itself.

Everything else is per-interstitial and lives in its own subfolder
(`Secrets/` is the first one): param schema, state union, data hooks, copy,
and feature flag. There is deliberately **no** shared interstitial registry,
state machine, or combined param schema — with one instance those would be
guesses. Add them when a second interstitial shows what is actually common.

## Adding one

Four things, no shared code to touch:

1. **A page** — `pages/mcp/<name>.tsx`, thin: `<Head>` title, the feature
   component, `withAuth`. Plus the matching `routes/mcp/<name>.tsx` wrapper
   and a checklist entry in `TANSTACK_MIGRATION.md` (see
   `apps/studio/AGENTS.md` on the TanStack migration).
2. **A folder** — `components/interfaces/MCP/<Name>/`, rendering inside
   `InterstitialShell` and ending on `InterstitialTerminalScreen`.
3. **A flag** — your own. `McpElicitURLMode` gates `Secrets/` specifically,
   not this folder.
4. **A param module** — your own zod schema. Don't extend the secrets one.

## Invariants

These hold namespace-wide. New interstitials are expected to keep them:

- **Standalone page.** No dashboard chrome, sidebar, or project layout. The
  user is mid-tool-call, not browsing. Keep the page out of
  `RouteValidationWrapper`'s org/project checks by adding its route constant
  to the exempt list.
- **Nothing sensitive in the URL.** Params identify a request (project ref,
  key name); they never carry the value being elicited. Anything a user
  supplies is typed on the page and sent over the API.
- **No query-string logging.** Don't put params into telemetry, Sentry
  breadcrumbs, or `console`.
- **Parse params, don't trust them.** zod with `.catch(undefined)` per field,
  and `.passthrough()` so a param minted by a newer server doesn't break an
  older dashboard. One bad param must not take out the others.
- **Every state has a recovery path.** Expired, cancelled, wrong account,
  paused, error — each one says what happened, whether anything was stored,
  and how to get unstuck. Never a dead end.
- **No flash.** Wait for feature flags to resolve and render
  `InterstitialShellSkeleton` in the meantime, rather than briefly showing the
  wrong screen.
- **Claim only what you did.** Storing a value is not validating it. Say what
  Supabase did and where the user can change it.
