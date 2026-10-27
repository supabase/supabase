import type { FgaGuardedEndpoint } from 'api-types'

import { useGrant, type GrantResult, type VariantOf } from '@/lib/grants'

type BranchVariant = 'production' | 'development'

/** Endpoints on a single branch, whose grant needs a production or development variant. */
export type BranchVariantEndpoint = {
  [E in FgaGuardedEndpoint]: [VariantOf<E>] extends [BranchVariant]
    ? [BranchVariant] extends [VariantOf<E>]
      ? E
      : never
    : never
}[FgaGuardedEndpoint]

type GrantResultForVariant<E extends FgaGuardedEndpoint, V> =
  V extends VariantOf<E> ? GrantResult<E, V> : never

export type BranchGrantResult<E extends BranchVariantEndpoint> = GrantResultForVariant<
  E,
  BranchVariant
>

type BranchGrantScope = { projectRef: string | undefined; isDefault: boolean | undefined }

/**
 * Grant for an action on a single branch. The backend requires production permissions for the
 * default branch and development permissions for preview branches. Loading until `isDefault` is
 * known. `projectRef` is the parent project, where branch permissions are evaluated.
 */
export function useBranchGrant<E extends BranchVariantEndpoint>(
  endpoint: E,
  scope: BranchGrantScope
): BranchGrantResult<E>
export function useBranchGrant(
  endpoint: BranchVariantEndpoint,
  { projectRef, isDefault }: BranchGrantScope
): BranchGrantResult<BranchVariantEndpoint> {
  const production = useGrant(endpoint, { projectRef }, { variant: 'production' })
  const development = useGrant(endpoint, { projectRef }, { variant: 'development' })

  if (isDefault === undefined) return { status: 'loading' }
  return isDefault ? production : development
}
