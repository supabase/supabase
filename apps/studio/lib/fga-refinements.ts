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
  /** Grants without a variant are rejected. For endpoints whose requirement depends on the target resource rather than the request. */
  variantRequired?: boolean
  /** Query params the fetch wrapper sets from the grant's variant. Callers can't pass them. */
  ownedQuery?: { readonly [param: string]: (variant: string | undefined) => unknown }
}

export type FgaRefinementMap = { readonly [E in FgaGuardedEndpoint]?: FgaRefinement<E> }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/** Production and development variants for an endpoint on a single branch, required on every grant. */
function branchVariants<A extends 'read' | 'write' | 'delete'>(action: A) {
  return {
    base: [[`branching_development_${action}`], [`branching_production_${action}`]],
    variants: {
      production: { requires: [[`branching_production_${action}`]] },
      development: { requires: [[`branching_development_${action}`]] },
    },
    variantRequired: true,
  } as const
}

// Requirements that depend on the request body or params, which the OpenAPI annotation can't express
// (for example, running a write query through pg-meta, or revealing an API key secret).
export const fgaRefinements = {
  'POST /v1/projects/{ref}/branches': {
    base: [['branching_development_create'], ['branching_production_create']],
    variants: {
      production: {
        requires: [['branching_production_create']],
        when: ({ body }) => isRecord(body) && (body.is_default === true || body.with_data === true),
      },
    },
  },
  'GET /v1/branches/{branch_id_or_ref}': branchVariants('read'),
  'PATCH /v1/branches/{branch_id_or_ref}': branchVariants('write'),
  'DELETE /v1/branches/{branch_id_or_ref}': branchVariants('delete'),
  'GET /v1/branches/{branch_id_or_ref}/diff': branchVariants('write'),
  'POST /v1/branches/{branch_id_or_ref}/merge': branchVariants('write'),
  'POST /v1/branches/{branch_id_or_ref}/push': branchVariants('write'),
  'POST /v1/branches/{branch_id_or_ref}/reset': branchVariants('write'),
  'POST /v1/branches/{branch_id_or_ref}/restore': branchVariants('write'),
} as const satisfies FgaRefinementMap

export type FgaRefinements = typeof fgaRefinements
