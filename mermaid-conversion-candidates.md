# Mermaid Conversion Candidates — Docs Images

A review of images in `apps/docs/` to identify which could be re-authored as
[Mermaid](https://mermaid.js.org/) diagrams (flowcharts, sequence, state, ER, git graphs)
instead of static raster/vector images.

## Why convert to Mermaid

- **Maintainable** — edits are text diffs, not Figma round-trips or re-exports.
- **Theme-aware** — Mermaid renders to match light/dark mode automatically, removing the
  need for paired `--light` / `--dark` assets.
- **Accessible & searchable** — labels become real text, not baked-in pixels.
- **Smaller repo** — replaces binary PNG/JPG/SVG assets with a few lines of code.

## Methodology & scope

`apps/docs/public/img` holds ~1,120 image files (821 PNG, 243 SVG, plus jpg/gif/webp).
The overwhelming majority are **UI screenshots, product photos, logos, and decorative
isometric illustrations** — none of which are Mermaid candidates.

Candidates were triaged by (1) filename keywords (`diagram`, `flow`, `arch`, `architecture`,
`schema`, `overview`, `workflow`, etc.) and (2) inspecting **every non-icon SVG**, then each
shortlisted image was viewed and classified. This is a targeted pass, not an exhaustive
pixel-level scan of all 800+ PNGs — a handful of diagrams with non-descriptive filenames may
remain undiscovered.

---

## Tier 1 — Already Mermaid (highest value, lowest effort)

These SVGs are **rendered Mermaid output** (they carry `aria-roledescription="flowchart-v2"`
/ `stateDiagram`). The original `.mmd` source should be recovered or trivially reconstructed
from the SVG, then embedded as a live Mermaid block. This also fixes the fact that they ship
as static SVGs that don't follow the site theme.

| Image                                                                                                                                           | Type         | Notes                                                                     |
| ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ------------------------------------------------------------------------- |
| [auth-mfa/auth-mfa-flow.svg](apps/docs/public/img/guides/auth-mfa/auth-mfa-flow.svg)                                                            | flowchart    | TOTP enroll/login flow (Setup flow / Login flow, AAL1→AAL2).              |
| [auth-mfa/auth-mfa-phone-flow.svg](apps/docs/public/img/guides/auth-mfa/auth-mfa-phone-flow.svg)                                                | flowchart    | Phone MFA variant of the above.                                           |
| [auth-signing-keys/states.svg](apps/docs/public/img/guides/auth-signing-keys/states.svg)                                                        | stateDiagram | Signing-key lifecycle: standby → in_use → previously_used → revoked.      |
| [connecting-to-postgres/connection-decision-tree.svg](apps/docs/public/img/guides/database/connecting-to-postgres/connection-decision-tree.svg) | flowchart    | "Database slowing down" scaling decision tree (also has a `-light` pair). |
| [read-replicas/read-replicas-flow.svg](apps/docs/public/img/guides/platform/read-replicas/read-replicas-flow.svg)                               | flowchart    | Read-replica routing flow.                                                |

---

## Tier 2 — Clean diagrams, straightforward to author

True diagrams (boxes/edges/entities) with clear labels. Convert directly; minor loss of
brand icons but structure maps cleanly to Mermaid.

### Entity-relationship → `erDiagram`

| Image                                                                                        | Notes                                                                                                           |
| -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| [storage/schema-design.png](apps/docs/public/img/storage/schema-design.png)                  | `buckets` / `objects` / `migrations` tables with columns, PK/FK, `bucket_id:id` relation. Textbook `erDiagram`. |
| [cli/snaplet-example-schema.png](apps/docs/public/img/guides/cli/snaplet-example-schema.png) | `User` / `Post` / `Comment` with FKs. Textbook `erDiagram`.                                                     |

### Flow / architecture → `flowchart` (often with `subgraph`)

| Image                                                                                                              | Notes                                                                                                                                       |
| ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| [integrations/onesignal/diagram.png](apps/docs/public/img/guides/integrations/onesignal/diagram.png)               | Supabase + OneSignal subgraphs; Database → Webhooks → Edge Functions → device; labeled edges (Insert, Push Notification).                   |
| [integrations/zuplo/arch.png](apps/docs/public/img/guides/integrations/zuplo/arch.png)                             | Developers / Developer Code → Developer Portal / Zuplo → backend, with labeled edges.                                                       |
| [cli/workflow.png](apps/docs/public/img/guides/cli/workflow.png)                                                   | Migration → local DB → PR branch → develop → main; git push / PR merge / Release edges.                                                     |
| [platform/realtime/architecture--light.png](apps/docs/public/img/guides/platform/realtime/architecture--light.png) | Users → Realtime Global Cluster (Region A/B subgraphs) → Tenant DB. Has `--light/--dark/--black` set; one Mermaid block replaces all three. |
| [realtime/realtime-arch.png](apps/docs/public/img/guides/realtime/realtime-arch.png)                               | Excalidraw-style: Postgres → Realtime Global Cluster (IAD/LHR) → Clients, inside an "Earth" boundary. Maps to flowchart + subgraph.         |
| [platform/billing-overview.png](apps/docs/public/img/guides/platform/billing-overview.png)                         | Nested containers: Organization → Project 1/2 → compute; Billing Account (Payment/Tax/Address). Nested `subgraph`. (Has `--light` pair.)    |

---

## Tier 3 — Convertible but stylized (expect visual change)

These are diagrams structurally, but rely on custom styling/layout. Mermaid can express the
information, though the result will look different from the designed asset. Convert only if
maintainability outweighs the bespoke look.

| Image                                                                                                                                                                                                           | Type      | Notes                                                                                                                                                   |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [supabase-architecture.svg](apps/docs/public/img/supabase-architecture.svg)                                                                                                                                     | flowchart | Figma-exported product architecture (text baked as paths). Convertible, but it's a hero/brand diagram — design fidelity may matter. Has `--light` pair. |
| [local-dev-environment.svg](apps/docs/public/img/local-dev-environment.svg)                                                                                                                                     | flowchart | Figma-exported local-dev architecture. Has `--light` pair.                                                                                              |
| [connecting-to-postgres/how-connection-pooling-works.png](apps/docs/public/img/guides/database/connecting-to-postgres/how-connection-pooling-works.png)                                                         | flowchart | Without/with pooling comparison (two subgraphs). Fairly decorative. Has `--light` pair.                                                                 |
| [integrations/change-flow.png](apps/docs/public/img/integrations/change-flow.png)                                                                                                                               | gitGraph  | PROD vs DEV branch with version nodes + numbered steps; custom two-column layout doesn't map 1:1 to `gitGraph`.                                         |
| [platform/branching/github-workflow.jpg](apps/docs/public/img/guides/platform/branching/github-workflow.jpg) (+ `-commit-migration`, `-with-remote-commit`, `-without-branching` variants, each with `--light`) | gitGraph  | Highly stylized branch-over-time illustrations. `gitGraph` conveys the concept but loses the bespoke styling.                                           |
| [database/managing-tables/schemas.png](apps/docs/public/img/database/managing-tables/schemas.png)                                                                                                               | flowchart | "Schema / Table" container concept (public, api). Mostly decorative — empty rounded rectangles, little text. Marginal value. Has `--light` pair.        |
| [realtime/realtime-broadcast-changes-migration-schema-example-light.png](apps/docs/public/img/guides/realtime/realtime-broadcast-changes-migration-schema-example-light.png)                                    | erDiagram | Single `moves` table card (Studio table-visualizer style). Only worth it as a one-entity `erDiagram`; low payoff. Has `-dark` pair.                     |

---

## Not candidates (for the record)

Reviewed and excluded:

- **Decorative isometric illustrations** — [how-client-libs.png](apps/docs/public/img/how-client-libs.png),
  [how-replication.png](apps/docs/public/img/how-replication.png),
  [how-transformation.png](apps/docs/public/img/how-transformation.png). Artistic renders, not diagrams.
- **UI / dashboard screenshots** — e.g. [integrations/bracket/006_sync_overview.png](apps/docs/public/img/guides/integrations/bracket/006_sync_overview.png),
  [platform/project-transfer-overview.png](apps/docs/public/img/guides/platform/project-transfer-overview.png),
  [ai/headless-search/headless.png](apps/docs/public/img/ai/headless-search/headless.png),
  [database/replication/replication-pipeline-actions.png](apps/docs/public/img/database/replication/replication-pipeline-actions.png) (and the other `replication-pipeline-*`),
  `storage/query-analytics-schema-name.png`, `platform/aws-marketplace-listing-overview.png`.
  These show product UI and can't be represented as Mermaid.
- The `/icons/` directory and logos/wordmarks/cards/badges — branding assets, not diagrams.

---

## Recommended order of work

1. **Tier 1** — recover/reconstruct the Mermaid source for the 5 already-Mermaid SVGs and
   swap the static SVGs for live Mermaid blocks. Lowest effort, immediate theme support.
2. **Tier 2 ER diagrams** (`schema-design`, `snaplet-example-schema`) — quick, high-clarity wins.
3. **Tier 2 flow/architecture** — convert per page; collapse `--light/--dark` pairs into single blocks.
4. **Tier 3** — only where maintenance value beats the loss of bespoke styling.
