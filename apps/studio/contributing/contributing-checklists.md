# Contributing Checklists

Use these checklists to verify your changes before opening a pull request.

## General

- [ ] Code builds without errors (`pnpm build --filter=studio`)
- [ ] Linting passes (`pnpm lint --filter=studio`)
- [ ] TypeScript type-check passes (`pnpm typecheck`)
- [ ] Unit tests pass (`pnpm test:studio`)
- [ ] New UI uses semantic Tailwind tokens (e.g. `bg-surface-100`, `text-foreground-light`) — no hardcoded colors
- [ ] New components import from `'ui'` and check `packages/ui/index.tsx` before introducing new primitives

## Bug fixes

- [ ] Root cause is identified and addressed (not just symptoms)
- [ ] Regression test added where feasible

## New features

- [ ] Feature works for both hosted (supabase.com/dashboard) and self-hosted deployments
- [ ] No hardcoded API URLs or project-specific assumptions
- [ ] Edge cases handled (loading, error, empty states)

## UI changes

- [ ] Tested in both light and dark mode
- [ ] Responsive at common viewport widths (mobile, tablet, desktop)
- [ ] No accessibility regressions (keyboard navigation, focus management, ARIA labels where needed)
