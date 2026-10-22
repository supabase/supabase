import type { QueryClient } from '@tanstack/react-query'
import { fgaRequirements, type FgaGuardedEndpoint } from 'api-types'
import { useIsLoggedIn } from 'common'
import { useMemo } from 'react'

import {
  permissionsQueryOptionsV2,
  usePermissionsQueryV2,
  type PermissionsV2Data,
} from '@/data/permissions/permissions-query-v2'
import { prefetchProjectDetail } from '@/data/projects/project-detail-query'
import { doPermissionsCheckV2, usePermissionScopeV2 } from '@/hooks/misc/useCheckPermissionsV2'
import { IS_PLATFORM } from '@/lib/constants'
import { fgaRefinements, type FgaRefinementMap, type FgaRefinements } from '@/lib/fga-refinements'
import { ResponseError } from '@/types'

export type VariantOf<E extends FgaGuardedEndpoint> = FgaRefinements extends {
  readonly [K in E]: { readonly variants: infer Vs }
}
  ? Extract<keyof Vs, string>
  : never

declare const grantBrand: unique symbol

/** Proof that the current user holds the FGA permissions an endpoint (and optional variant) requires. */
export type Grant<E extends FgaGuardedEndpoint, V extends VariantOf<E> = never> = {
  readonly endpoint: E
  readonly variant: [V] extends [never] ? undefined : V
  readonly organizationSlug: string | undefined
  /** The ref the grant authorizes (the branch ref for branch projects). */
  readonly projectRef: string | null | undefined
  // Function type: invariant in E and V. A plain property would be covariant, so `Grant<E, never>` would satisfy `Grant<E, 'write'>`.
  readonly [grantBrand]: (_: { e: E; v: V }) => { e: E; v: V }
}

export type GrantResult<E extends FgaGuardedEndpoint, V extends VariantOf<E> = never> =
  | { status: 'loading'; grant?: never }
  | { status: 'granted'; grant: Grant<E, V> }
  | { status: 'denied'; grant?: never }
  | { status: 'error'; error: ResponseError; grant?: never }

export type GrantScope = {
  organizationSlug?: string
  projectRef?: string | null
}

type ResolvedGrantScope = GrantScope & { permissionsProjectRef?: string | null }

type EndpointKey<M extends string, P extends string> = `${Uppercase<M>} ${P}`

type VariantOfKey<K extends string> = K extends FgaGuardedEndpoint ? VariantOf<K> : never

/** Grant type for an endpoint, or `never` if the endpoint isn't annotated. For xQueryOptions / mutation variables. */
export type GrantFor<
  M extends string,
  P extends string,
  V extends VariantOfKey<EndpointKey<M, P>> = never,
> = EndpointKey<M, P> extends FgaGuardedEndpoint ? Grant<EndpointKey<M, P>, V> : never

function mintGrant<E extends FgaGuardedEndpoint, V extends VariantOf<E>>(
  endpoint: E,
  variant: V | undefined,
  scope: GrantScope
): Grant<E, V> {
  // The brand is type-only: this is the one place a grant is created
  return {
    endpoint,
    variant,
    organizationSlug: scope.organizationSlug,
    projectRef: scope.projectRef,
  } as unknown as Grant<E, V>
}

/**
 * Pure check of `permissions` against the endpoint's requirements (and the variant's, if given).
 * Permissions are evaluated against `permissionsProjectRef` (the parent project for branches),
 * falling back to `projectRef`; the minted grant records `projectRef`.
 */
export function getGrant<E extends FgaGuardedEndpoint, V extends VariantOf<E> = never>(
  permissions: PermissionsV2Data | undefined,
  endpoint: E,
  scope: ResolvedGrantScope,
  opts?: { variant?: V }
): { status: 'granted'; grant: Grant<E, V> } | { status: 'denied' } {
  const variant = opts?.variant
  if (!IS_PLATFORM) return { status: 'granted', grant: mintGrant(endpoint, variant, scope) }

  const evaluatedProjectRef = scope.permissionsProjectRef ?? scope.projectRef
  const passesBase = doPermissionsCheckV2(
    permissions,
    fgaRequirements[endpoint],
    scope.organizationSlug,
    evaluatedProjectRef
  )
  if (!passesBase) return { status: 'denied' }

  if (variant !== undefined) {
    const refinements: FgaRefinementMap = fgaRefinements
    const requires = refinements[endpoint]?.variants[variant]?.requires
    if (
      !requires ||
      !doPermissionsCheckV2(permissions, requires, scope.organizationSlug, evaluatedProjectRef)
    ) {
      return { status: 'denied' }
    }
  }

  return { status: 'granted', grant: mintGrant(endpoint, variant, scope) }
}

/**
 * Mints a grant for the current user, resolving organization and project from the URL unless
 * `scope` overrides them. Self-hosted always grants.
 */
export function useGrant<E extends FgaGuardedEndpoint, V extends VariantOf<E> = never>(
  endpoint: E,
  scope: GrantScope,
  opts?: { variant?: V }
): GrantResult<E, V> {
  const variant = opts?.variant
  const isLoggedIn = useIsLoggedIn()

  const {
    data: permissions,
    error: permissionsError,
    isPending: isLoadingPermissions,
  } = usePermissionsQueryV2()
  const {
    organizationSlug,
    projectRef,
    permissionsProjectRef,
    isLoading: isLoadingScope,
    error: scopeError,
  } = usePermissionScopeV2({ ...scope, enabled: IS_PLATFORM && isLoggedIn })

  return useMemo((): GrantResult<E, V> => {
    if (!IS_PLATFORM)
      return getGrant(permissions, endpoint, { organizationSlug, projectRef }, { variant })
    if (!isLoggedIn) return { status: 'loading' }
    if (permissionsError) return { status: 'error', error: permissionsError }
    if (scopeError) return { status: 'error', error: scopeError }
    if (isLoadingPermissions || isLoadingScope) return { status: 'loading' }

    return getGrant(
      permissions,
      endpoint,
      { organizationSlug, projectRef, permissionsProjectRef },
      { variant }
    )
  }, [
    endpoint,
    variant,
    permissions,
    permissionsError,
    scopeError,
    isLoggedIn,
    isLoadingPermissions,
    isLoadingScope,
    organizationSlug,
    projectRef,
    permissionsProjectRef,
  ])
}

/**
 * Imperative counterpart of `useGrant` for prefetching and callbacks. Reuses fresh cached
 * permissions and project details, fetching them otherwise.
 */
export async function ensureGrant<E extends FgaGuardedEndpoint, V extends VariantOf<E> = never>(
  queryClient: QueryClient,
  endpoint: E,
  scope: ResolvedGrantScope,
  opts?: { variant?: V }
): Promise<
  | { status: 'granted'; grant: Grant<E, V> }
  | { status: 'denied' }
  | { status: 'error'; error: ResponseError }
> {
  if (!IS_PLATFORM) return getGrant(undefined, endpoint, scope, opts)

  try {
    const permissions = await queryClient.fetchQuery(permissionsQueryOptionsV2())

    let permissionsProjectRef = scope.permissionsProjectRef
    if (permissionsProjectRef === undefined && typeof scope.projectRef === 'string') {
      const project = await prefetchProjectDetail(queryClient, { ref: scope.projectRef })
      permissionsProjectRef = project.parent_project_ref ?? scope.projectRef
    }

    return getGrant(permissions, endpoint, { ...scope, permissionsProjectRef }, opts)
  } catch (error) {
    const responseError =
      error instanceof ResponseError
        ? error
        : new ResponseError(error instanceof Error ? error.message : undefined)
    return { status: 'error', error: responseError }
  }
}
