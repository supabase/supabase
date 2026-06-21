---
name: audit-content-listings
description: >-
  Audits and converts Supabase docs overview link sections to content listings.
  Inventories GlassPanel/IconPanel grids, updates conversion-manifest.yaml, and
  walks the data → registry → MDX workflow. Use for content listings, overview
  pages, next steps standardisation, batch convert follow-on PRs, or
  re-auditing partially converted pages like getting-started.
disable-model-invocation: true
---

# Audit content listings

Systematically audit overview/index pages and convert curated link sections to [content listings](apps/docs/CONTRIBUTING.md#overview-pages-and-content-listings).

## When to use

- Follow-on PR after DOCS-1032 pilot pages land
- Re-audit a **partially converted** page before converting remaining sections
- Batch convert overview pages still using manual `GlassPanel` / `IconPanel` grids

## Scope

**In scope:** Curated link grids on overview/index pages — Get started, Next steps, Examples, Resources.

**Out of scope:** Tutorial/quickstart body content, reference spec pages, interactive demos, reusable `$Partial` blocks (unless explicitly migrating), sections with JSX titles that cannot be simplified.

## System map

| Layer             | Path                                                                            |
| ----------------- | ------------------------------------------------------------------------------- |
| Progress tracker  | `apps/docs/components/listings/conversion-manifest.yaml`                        |
| Data modules      | `apps/docs/components/listings/*.data.ts`                                       |
| Registry          | `apps/docs/components/listings/listings-markdown-registry.ts`                   |
| Schema            | `apps/docs/lib/content-listings.schema.ts`                                      |
| Canonical example | `storage.data.ts` + `storage.mdx`                                               |
| VS Code snippets  | `.vscode/content-listing.code-snippets` (`cl-data`, `cl-registry`, `cl-inline`) |

**Manifest vs registry:** The manifest tracks progress, defer/skip reasons, and batch tags. The registry is the code source of truth for implemented components. Update both when converting.

## Phase 1 — Audit (read-only)

Run from repo root:

```bash
# Already converted
rg '<\w+Listings\s*/>' apps/docs/content/guides --glob '*.mdx'

# Candidate manual link grids
rg 'GlassPanel|IconPanel' apps/docs/content/guides --glob '*.mdx' -l

# Overview-style pages
rg 'hideToc:\s*true' apps/docs/content/guides --glob '*.mdx' -l

# Registered listing components
rg '^\s+\w+Listings:' apps/docs/components/listings/listings-markdown-registry.ts

# Partial pages (listings AND manual grids on same file)
rg -l '<\w+Listings\s*/>' apps/docs/content/guides --glob '*.mdx' \
  | xargs rg -l 'GlassPanel|IconPanel' 2>/dev/null || true
```

### Partial-page re-audit

Required for any file matching the last command (currently `getting-started.mdx`):

1. List every `<*Listings />` in MDX; cross-check exports in `[topic].data.ts` and registry
2. Walk MDX top-to-bottom; record each `###` heading or `$Show` block as converted or unconverted
3. Check for duplicate `href`s across converted listings and remaining grids
4. Note `$Show` / `$Partial` boundaries that must survive conversion
5. Assign section taxonomy (Use cases → Examples; quickstarts/demos/tutorials → separate groups with `headingLevel: '###'`)

### Classification

| Pattern                                  | Action                                               |
| ---------------------------------------- | ---------------------------------------------------- |
| Curated internal doc links               | Convert → Get started / Next steps                   |
| Demos, GitHub, sample apps               | Convert → Examples                                   |
| External repos, OpenAPI, upstream docs   | Convert → Resources                                  |
| Prose only (no link grid)                | Keep                                                 |
| Reused partial (`providers.mdx`)         | Keep partial                                         |
| `$Show`-gated block                      | Convert; keep `$Show` wrapper in MDX                 |
| JSX in card titles (`<Badge>`, `<span>`) | Defer or simplify — see [reference.md](reference.md) |
| Single CTA + one link                    | Convert to 1-item grid or fold into adjacent listing |

### Outputs

1. **Audit report table** (chat or PR body):

| Page | Section | Pattern | Status | Action | Notes |
| ---- | ------- | ------- | ------ | ------ | ----- |

2. **`conversion-manifest.yaml`** — persistent checklist; refresh `last_audit` date. Do not rely on chat-only output across PRs.

Validate manifest drift:

```bash
node .claude/skills/audit-content-listings/scripts/validate-conversion-manifest.mjs
```

## Phase 2 — Convert (per section)

1. Add `ContentListingGroup` export to `apps/docs/components/listings/[topic].data.ts`
2. Register in `listings-markdown-registry.ts` — **PascalCase + `Listings` suffix** (e.g. `AiExamplesListings`)
3. Replace manual MDX (heading + grid) with `<AiExamplesListings />`
4. Remove redundant prose the listing now covers
5. Preserve `$Show`, `$Partial`, vale comments
6. Update manifest: set `status: converted`, add `component` + `export` — same commit as code

**Layout defaults:**

- `type: 'grid'`, default 3 columns; `columns: 2` for wider cards
- `type: 'list'` for dense links (auth pricing)
- `headingLevel: '###'` when replacing `###` subsections
- Always set `id` for telemetry

Naming conventions and edge cases: [reference.md](reference.md).

## Phase 3 — Verify

| Gate            | Command                                                                               |
| --------------- | ------------------------------------------------------------------------------------- |
| Schema + hrefs  | `cd apps/docs && pnpm vitest content-listings --run`                                  |
| Markdown export | `cd apps/docs && pnpm build:guides-markdown` — spot-check `.md` output                |
| MDX lint        | `pnpm lint:mdx` on changed paths                                                      |
| Manifest        | `node .claude/skills/audit-content-listings/scripts/validate-conversion-manifest.mjs` |
| Visual          | Before/after screenshots under `.github/pr-screenshots/`                              |

**Manifest reconciliation:**

- Every `status: converted` row → export in `.data.ts`, registry key, `<Component />` in MDX
- Every `status: unconverted` on partial pages → manual grid still present
- No duplicate `href`s across sections on the same page

## PR batching

| Batch | Scope                                                                                   |
| ----- | --------------------------------------------------------------------------------------- |
| **0** | Re-audit only — `getting-started.mdx`; confirm existing listings before converting rest |
| **A** | Complete `getting-started.mdx` (blocked until Batch 0 approved)                         |
| **B** | `ai.mdx`, `cli.mdx`, `self-hosting.mdx`                                                 |
| **C** | `resources.mdx` and nested `overview.mdx` files from manifest                           |

Each batch: extend one topic `.data.ts`, registry entries, MDX, manifest, vitest pass.

## Pilot references

**Fully converted** (use as templates): auth, database/overview, storage (best), functions, realtime.

**Partial — re-audit first:** `getting-started.mdx` — Get started converted; Next steps planned but not yet in registry/MDX; Use cases, Framework quickstarts, Web app demos, Mobile tutorials unconverted; nimbus partial skipped.

See seeded state in `apps/docs/components/listings/conversion-manifest.yaml`.

## Additional resources

- [reference.md](reference.md) — before/after snippets, `$Show` pattern, getting-started case study, href rules
- [CONTRIBUTING § Overview pages](apps/docs/CONTRIBUTING.md#overview-pages-and-content-listings)
