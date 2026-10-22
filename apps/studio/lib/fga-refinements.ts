import type { FgaGuardedEndpoint, FgaRequirements } from 'api-types'

import type { FgaRequirementGroups } from '@/hooks/misc/useCheckPermissionsV2'

export type FgaRefinement<E extends FgaGuardedEndpoint> = {
  /** The annotation from `fga-requirements.ts` this refinement was written against. Typecheck fails if the generated annotation changes, so the refinement gets re-reviewed. */
  base: FgaRequirements[E]
  /** Named variants. A grant for a variant needs the base requirement AND the variant's `requires`. */
  variants: { readonly [variant: string]: { readonly requires: FgaRequirementGroups } }
}

export type FgaRefinementMap = { readonly [E in FgaGuardedEndpoint]?: FgaRefinement<E> }

// Requirements that depend on the request body or params, which the OpenAPI annotation can't express
// (for example, running a write query through pg-meta, or revealing an API key secret).
export const fgaRefinements = {} as const satisfies FgaRefinementMap

export type FgaRefinements = typeof fgaRefinements
