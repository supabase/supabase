import { fgaRequirements, type FgaGuardedEndpoint } from 'api-types'
import type { FetchOptions, FetchResponse } from 'openapi-fetch'
import type {
  FilterKeys,
  HttpMethod,
  MediaType,
  PathsWithMethod,
  RequiredKeysOf,
} from 'openapi-typescript-helpers'

import {
  fgaRefinements,
  type FgaRefinement,
  type FgaRefinements,
  type RefinableInit,
} from '@/lib/fga-refinements'
import type { EndpointKey, Grant, VariantOf } from '@/lib/grants'

type InitParam<Init> =
  RequiredKeysOf<Init> extends never
    ? [(Init & { [key: string]: unknown })?]
    : [Init & { [key: string]: unknown }]

declare const unguardedBrand: unique symbol

/** Marks a call to an annotated endpoint that intentionally carries no grant. Create with `unguarded`. */
export type Unguarded = (
  | { readonly unguarded: 'migrating' }
  | { readonly unguarded: 'byDesign'; readonly reason: string }
) & { readonly [unguardedBrand]: true }

export const unguarded = {
  /** Call site not yet migrated to grants. Counted by the lint ratchet, so the number only goes down. */
  migrating: Object.freeze({ unguarded: 'migrating' }) as Unguarded,
  /** Intentionally skips the grant check, for example to call optimistically and let the backend gate the request. */
  byDesign: (reason: string): Unguarded => ({ unguarded: 'byDesign', reason }) as Unguarded,
}

type GrantForVariant<K extends FgaGuardedEndpoint, V> = V extends VariantOf<K> ? Grant<K, V> : never

/** The grants a call to endpoint `K` accepts: a plain grant or a grant for any of its variants. */
type AcceptedGrant<K extends FgaGuardedEndpoint> = Grant<K> | GrantForVariant<K, VariantOf<K>>

type OwnedQueryKeys<K extends string> = FgaRefinements extends {
  readonly [X in K]: { readonly ownedQuery: infer O }
}
  ? Extract<keyof O, string>
  : never

// `?: never` is needed: `Omit` alone can leave `{}`, which accepts any object, including an owned param.
type OmitOwnedQuery<Q, Owned extends string> = Q extends object
  ? Omit<Q, Owned> & { [K in Owned]?: never }
  : Q
type OmitOwnedParams<P, Owned extends string> = P extends object
  ? { [K in keyof P]: K extends 'query' ? OmitOwnedQuery<P[K], Owned> : P[K] }
  : P
type OmitOwned<Init, Owned extends string> = [Owned] extends [never]
  ? Init
  : { [K in keyof Init]: K extends 'params' ? OmitOwnedParams<Init[K], Owned> : Init[K] }

type GrantOption<K extends string> = K extends FgaGuardedEndpoint
  ? { grant: AcceptedGrant<K> | Unguarded }
  : { grant?: never }

type MaybeOptional<T> = RequiredKeysOf<T> extends never ? T | undefined : T

type CheckedInit<Init, Option> =
  | (undefined extends Init ? (Option extends { grant: unknown } ? never : undefined) : never)
  | ([Exclude<Init, undefined>] extends [Option]
      ? Exclude<Init, undefined>
      : Omit<Exclude<Init, undefined>, 'grant'> & Option)

type ParseAsContext<Init> = { parseAs?: (NonNullable<Init> & { parseAs?: unknown })['parseAs'] }

export type GuardedClientMethod<
  Paths extends {},
  M extends HttpMethod,
  Media extends MediaType = MediaType,
> = <
  Path extends PathsWithMethod<Paths, M>,
  Init extends MaybeOptional<
    OmitOwned<
      FetchOptions<FilterKeys<Paths[Path], M>>,
      OwnedQueryKeys<EndpointKey<M, Path & string>>
    >
  >,
>(
  url: Path,
  ...init: InitParam<
    CheckedInit<Init, GrantOption<EndpointKey<M, NoInfer<Path> & string>>> & ParseAsContext<Init>
  >
) => Promise<FetchResponse<FilterKeys<Paths[Path], M>, Init, Media>>

type AnyRefinement = FgaRefinement<FgaGuardedEndpoint>
type FetchInit = Record<string, unknown> & RefinableInit

function getRefinement(endpoint: string) {
  return (fgaRefinements as Record<string, AnyRefinement | undefined>)[endpoint]
}

/** Runtime view of a grant: the brand is type-only, and the variant isn't narrowed. */
type GrantValue = Omit<Grant<FgaGuardedEndpoint>, 'variant'> & { variant: string | undefined }

function isGrant(value: unknown): value is GrantValue {
  return typeof value === 'object' && value !== null && 'endpoint' in value
}

function isUnguarded(value: unknown): value is Unguarded {
  return typeof value === 'object' && value !== null && 'unguarded' in value
}

function withOwnedParams(
  init: FetchInit,
  grant: unknown,
  refinement: AnyRefinement | undefined
): FetchInit {
  if (!refinement?.ownedQuery) return init

  const variant = isGrant(grant) ? grant.variant : undefined
  const query: Record<string, unknown> = { ...init.params?.query }
  for (const [param, valueFor] of Object.entries(refinement.ownedQuery)) {
    const value = valueFor(variant)
    if (value === undefined) delete query[param]
    else query[param] = value
  }
  return { ...init, params: { ...init.params, query } }
}

export class GrantAssertionError extends Error {
  constructor(endpoint: string, message: string) {
    super(`[assertGrant] ${endpoint}: ${message}`)
    this.name = 'GrantAssertionError'
  }
}

/**
 * Runtime counterpart of the wrapper types, for what the compiler can't see: casts, union-typed
 * paths, and the ref/slug/variant the request actually uses. Throws `GrantAssertionError`.
 */
export function assertGrant(endpoint: string, grant: unknown, init: RefinableInit) {
  if (!(endpoint in fgaRequirements)) {
    if (grant !== undefined) {
      throw new GrantAssertionError(endpoint, 'endpoint has no FGA annotation; remove the grant')
    }
    return
  }

  if (grant === undefined) {
    throw new GrantAssertionError(endpoint, 'missing grant; pass a grant or `unguarded`')
  }

  if (isUnguarded(grant)) {
    if (grant.unguarded === 'byDesign' && !grant.reason) {
      throw new GrantAssertionError(endpoint, '`unguarded.byDesign` needs a reason')
    }
    return
  }

  if (!isGrant(grant)) {
    throw new GrantAssertionError(endpoint, 'grant is not a grant or `unguarded`')
  }

  if (grant.endpoint !== endpoint) {
    throw new GrantAssertionError(endpoint, `grant is for ${grant.endpoint}`)
  }

  const refinement = getRefinement(endpoint)
  if (grant.variant !== undefined && !refinement?.variants[grant.variant]) {
    throw new GrantAssertionError(endpoint, `unknown variant '${grant.variant}'`)
  }
  for (const [variant, { when }] of Object.entries(refinement?.variants ?? {})) {
    if (when?.(init) && grant.variant !== variant) {
      throw new GrantAssertionError(
        endpoint,
        `request needs variant '${variant}', grant has ${grant.variant ? `'${grant.variant}'` : 'none'}`
      )
    }
  }

  const pathRef = init.params?.path?.ref
  if (
    typeof pathRef === 'string' &&
    typeof grant.projectRef === 'string' &&
    pathRef !== grant.projectRef &&
    pathRef !== grant.permissionsProjectRef
  ) {
    throw new GrantAssertionError(
      endpoint,
      `grant is for project '${grant.projectRef}', request is for '${pathRef}'`
    )
  }

  const pathSlug = init.params?.path?.slug
  if (
    typeof pathSlug === 'string' &&
    typeof grant.organizationSlug === 'string' &&
    pathSlug !== grant.organizationSlug
  ) {
    throw new GrantAssertionError(
      endpoint,
      `grant is for organization '${grant.organizationSlug}', request is for '${pathSlug}'`
    )
  }
}

type RawMethod = (url: string, init?: Record<string, unknown>) => Promise<unknown>

/** Wraps a raw openapi-fetch method: strips `grant`, sets owned params, and runs `assertGrant` in development. */
export function guardMethod(method: HttpMethod, rawMethod: (...args: never[]) => unknown) {
  const methodPrefix = method.toUpperCase()
  const raw = rawMethod as unknown as RawMethod

  return (url: string, init?: FetchInit) => {
    const endpoint = `${methodPrefix} ${url}`
    const { grant, ...rest } = init ?? {}
    const requestInit = withOwnedParams(rest, grant, getRefinement(endpoint))

    if (process.env.NODE_ENV !== 'production') {
      assertGrant(endpoint, grant, requestInit)
    }

    return raw(url, requestInit)
  }
}
