# Copilot Code Review Instructions

## Repo Context

This is a TypeScript/Next.js/React monorepo:

- `apps/studio/` — Supabase Dashboard (primary review target)
- `apps/www/` — Marketing site
- `apps/docs/` — Documentation
- `packages/common/` — Shared code including telemetry definitions

## Topic-Specific Guidelines

Detailed review rules are in path-specific instruction files under `.github/instructions/`:

- **Telemetry**: `studio-telemetry.instructions.md` — event naming, property conventions, feature flag measurement
- **Testing**: `studio-testing.instructions.md` — test strategy, extraction patterns, coverage expectations

These files are scoped to `apps/studio/` and applied automatically by Copilot during reviews.

## References

For the full, authoritative versions of these standards:

- Telemetry: `.claude/skills/telemetry-standards/SKILL.md`
- Testing: `.claude/skills/studio-testing/SKILL.md`
