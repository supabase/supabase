# Supabase Monorepo

pnpm 10 + Turborepo monorepo. Requires Node >= 22.

## Structure

| Directory         | Purpose                                                      |
| ----------------- | ------------------------------------------------------------ |
| `apps/studio`     | Supabase Studio/Dashboard — Next.js (pages router), React 18 |
| `apps/docs`       | Documentation site                                           |
| `apps/www`        | Marketing website                                            |
| `packages/ui`     | Shared UI components (shadcn/ui based)                       |
| `packages/common` | Shared utilities and telemetry constants                     |
| `e2e/studio`      | Playwright E2E tests for Studio                              |

## Common Commands

```bash
pnpm install                          # install dependencies
pnpm dev:studio                       # run Studio dev server
pnpm test:studio                      # run Studio unit tests (vitest)
pnpm --prefix e2e/studio run e2e       # run Studio E2E tests (playwright)
pnpm build --filter=studio             # build Studio
pnpm lint --filter=studio              # lint Studio
pnpm typecheck                        # typecheck all packages
```

## Conventions

**UI** — import from `'ui'`, use `_Shadcn_` suffixed variants for form primitives. Check `packages/ui/index.tsx` before creating new primitives.

**Styling** — Tailwind only, semantic tokens (`bg-muted`, `text-foreground-light`), no hardcoded colors.

## Studio

Pages router. Co-locate sub-components with parent. Avoid barrel re-export files.

See studio-\* skills for detailed studio conventions.
