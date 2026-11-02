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
  /** The ref permissions were evaluated against (the parent project for branch projects). */
  readonly permissionsProjectRef: string | null | undefined
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

/** `permissionsProjectRef` is the ref permissions are evaluated against: the parent project for branches. */
type ResolvedGrantScope = GrantScope & { permissionsProjectRef: string | null | undefined }

/** The `fgaRequirements` key for a method and path, e.g. `GET /v1/projects/{ref}`. */
export type EndpointKey<M extends string, P extends string> = `${Uppercase<M>} ${P}`

type VariantOfKey<K extends string> = K extends FgaGuardedEndpoint ? VariantOf<K> : never

/** Grant type for an endpoint, or `never` if the endpoint isn't annotated. For xQueryOptions / mutation variables. */
export type GrantFor<
  M extends string,
  P extends string,
  V extends VariantOfKey<EndpointKey<M, P>> = never,
> = EndpointKey<M, P> extends FgaGuardedEndpoint ? Grant<EndpointKey<M, P>, V> : never

type GrantForVariant<E extends FgaGuardedEndpoint, V> = V extends VariantOf<E> ? Grant<E, V> : never

/** A grant for any one of an endpoint's variants, or `never` if the endpoint isn't annotated. */
export type GrantForVariants<M extends string, P extends string> =
  EndpointKey<M, P> extends FgaGuardedEndpoint
    ? GrantForVariant<EndpointKey<M, P>, VariantOf<EndpointKey<M, P>>>
    : never

function mintGrant<E extends FgaGuardedEndpoint, V extends VariantOf<E>>(
  endpoint: E,
  variant: V | undefined,
  scope: ResolvedGrantScope
): Grant<E, V> {
  // The brand is type-only: this is the one place a grant is created
  return {
    endpoint,
    variant,
    organizationSlug: scope.organizationSlug,
    projectRef: scope.projectRef,
    permissionsProjectRef: scope.permissionsProjectRef,
  } as unknown as Grant<E, V>
}

/**
 * Pure check of `permissions` against the endpoint's requirements (and the variant's, if given),
 * evaluated against `permissionsProjectRef`. The minted grant records both refs.
 */
export function getGrant<E extends FgaGuardedEndpoint, V extends VariantOf<E> = never>(
  permissions: PermissionsV2Data | undefined,
  endpoint: E,
  scope: ResolvedGrantScope,
  opts?: { variant?: V }
): { status: 'granted'; grant: Grant<E, V> } | { status: 'denied' } {
  const variant = opts?.variant
  if (!IS_PLATFORM) return { status: 'granted', grant: mintGrant(endpoint, variant, scope) }

  const passesBase = doPermissionsCheckV2(
    permissions,
    fgaRequirements[endpoint],
    scope.organizationSlug,
    scope.permissionsProjectRef
  )
  if (!passesBase) return { status: 'denied' }

  if (variant !== undefined) {
    const refinements: FgaRefinementMap = fgaRefinements
    const requires = refinements[endpoint]?.variants[variant]?.requires
    if (
      !requires ||
      !doPermissionsCheckV2(
        permissions,
        requires,
        scope.organizationSlug,
        scope.permissionsProjectRef
      )
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
      return getGrant(
        permissions,
        endpoint,
        { organizationSlug, projectRef, permissionsProjectRef: projectRef },
        { variant }
      )
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

async function resolveGrantScope(
  queryClient: QueryClient,
  scope: GrantScope & { permissionsProjectRef?: string | null }
): Promise<ResolvedGrantScope> {
  const { permissionsProjectRef, projectRef } = scope
  if (permissionsProjectRef !== undefined) return { ...scope, permissionsProjectRef }
  if (!IS_PLATFORM || typeof projectRef !== 'string') {
    return { ...scope, permissionsProjectRef: projectRef }
  }

  const project = await prefetchProjectDetail(queryClient, { ref: projectRef })
  return { ...scope, permissionsProjectRef: project.parent_project_ref ?? projectRef }
}

/**
 * Imperative counterpart of `useGrant` for prefetching and callbacks. Reuses fresh cached
 * permissions and project details, fetching them otherwise. Pass `permissionsProjectRef` to skip
 * resolving a branch's parent project.
 */
export async function ensureGrant<E extends FgaGuardedEndpoint, V extends VariantOf<E> = never>(
  queryClient: QueryClient,
  endpoint: E,
  scope: GrantScope & { permissionsProjectRef?: string | null },
  opts?: { variant?: V }
): Promise<
  | { status: 'granted'; grant: Grant<E, V> }
  | { status: 'denied' }
  | { status: 'error'; error: ResponseError }
> {
  try {
    const [permissions, resolvedScope] = await Promise.all([
      IS_PLATFORM ? queryClient.fetchQuery(permissionsQueryOptionsV2()) : undefined,
      resolveGrantScope(queryClient, scope),
    ])
    return getGrant(permissions, endpoint, resolvedScope, opts)
  } catch (error) {
    const responseError =
      error instanceof ResponseError
        ? error
        : new ResponseError(error instanceof Error ? error.message : undefined)
    return { status: 'error', error: responseError }
  }
}
