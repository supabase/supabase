import type { FgaGuardedEndpoint } from 'api-types'

import type { Grant, VariantOf } from '@/lib/grants'

/**
 * Mints a grant without a permissions check, for unit tests of fetchers and query options that
 * take a grant. Components should get real grants from `useGrant` against mocked permissions.
 */
export function testGrant<E extends FgaGuardedEndpoint, V extends VariantOf<E> = never>(
  endpoint: E,
  opts: {
    variant?: V
    organizationSlug?: string
    projectRef?: string | null
    permissionsProjectRef?: string | null
  } = {}
): Grant<E, NoInfer<V>> {
  // Grants are type-branded; production code can only mint them through `lib/grants`
  return {
    endpoint,
    variant: opts.variant,
    organizationSlug: opts.organizationSlug,
    projectRef: opts.projectRef,
    permissionsProjectRef:
      opts.permissionsProjectRef === undefined ? opts.projectRef : opts.permissionsProjectRef,
  } as unknown as Grant<E, V>
}
