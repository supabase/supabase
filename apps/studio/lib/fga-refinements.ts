import type { FgaGuardedEndpoint, FgaRequirements } from 'api-types'

import type { FgaRequirementGroups } from '@/hooks/misc/useCheckPermissionsV2'

/** The parts of a fetch init that refinements can inspect. */
export type RefinableInit = {
  params?: { path?: Record<string, unknown>; query?: Record<string, unknown> }
  body?: unknown
}

export type FgaRefinement<E extends FgaGuardedEndpoint> = {
  /** The annotation from `fga-requirements.ts` this refinement was written against. Typecheck fails if the generated annotation changes, so the refinement gets re-reviewed. */
  base: FgaRequirements[E]
  /** Named variants. A grant for a variant needs the base requirement AND the variant's `requires`. */
  variants: {
    readonly [variant: string]: {
      readonly requires: FgaRequirementGroups
      /** Returns true if the request needs this variant. Checked at runtime in development only. */
      readonly when?: (init: RefinableInit) => boolean
    }
  }
  /** Query params the fetch wrapper sets from the grant's variant. Callers can't pass them. */
  ownedQuery?: { readonly [param: string]: (variant: string | undefined) => unknown }
}

export type FgaRefinementMap = { readonly [E in FgaGuardedEndpoint]?: FgaRefinement<E> }

// Requirements that depend on the request body or params, which the OpenAPI annotation can't express
// (for example, running a write query through pg-meta, or revealing an API key secret).
export const fgaRefinements = {} as const satisfies FgaRefinementMap

export type FgaRefinements = typeof fgaRefinements
