---
name: api-types
description: Maintain Supabase API types. Use when changing generated API type declarations, OpenAPI schemas, or investigating API type deployment drift.
---

# API types

The generated API contract has three specs: API v1, API v2, and Platform. Their committed outputs are `packages/api-types/types/api-v1.d.ts`, `packages/api-types/types/api-v2.d.ts`, and `packages/api-types/types/platform.d.ts`.

## Update types

1. Make the API/schema change and ensure it is deployed to production before relying on a type PR. Production is the merge-gate source of truth.
2. Run `pnpm api:codegen` against a running local API environment. It fetches all three local OpenAPI specs and updates the committed files.
3. Inspect and commit only the intended generated type changes.
4. Run `pnpm api:verify-types`. It fetches the three production OpenAPI specs, regenerates types with the repository tooling, and compares them with the committed files.

Complete the update only when `pnpm api:verify-types` passes after the production deployment is available.

## Interpret verification

- A pass means the committed generated declarations match all three production specs at the time of the check.
- A mismatch means production and the committed files differ. If the API is not deployed, deploy it and rerun the check. If production is correct, regenerate and review the changed files.
- A fetch failure means the production schema endpoint could not be read; fix or retry the endpoint before treating the result as a type mismatch.

## Pull requests

The `Verify production API types` CI job runs when `packages/api-types/types/**` changes and performs the same production comparison. It is currently observational, not a required merge check. The `api-deploy-required` label is informational only. Still run the local verifier before requesting review and treat a failed CI verification as production drift that must be resolved.
