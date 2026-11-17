import { useMemo } from 'react'

import { MULTIGRES_SCHEMA_NAME, resolveHighAvailability } from './useHighAvailability.constants'
import {
  useIsHighAvailability,
  useProjectCapabilities,
  useSelectedProjectQuery,
} from './useSelectedProject'

export { MULTIGRES_SCHEMA_NAME, resolveHighAvailability }

export function useHighAvailability() {
  const isHighAvailability = useIsHighAvailability()
  const { isPending } = useSelectedProjectQuery()

  return {
    isHighAvailability,
    isHighAvailabilityDisabled: !isHighAvailability,
    isPending,
  }
}

/**
 * `shouldHideMultigresSchema` is whether this project runs on the Multigres
 * stack (full Multigres or Multigres Lite) and therefore has the internal
 * `multigres` schema to hide — not whether it's specifically HA. See
 * `useSchemasFilteredForHighAvailability` below for how that's derived.
 */
export function filterSchemasForHighAvailability<T extends { name: string }>(
  schemas: T[],
  shouldHideMultigresSchema: boolean
) {
  if (!shouldHideMultigresSchema) return schemas

  return schemas.filter((schema) => schema.name !== MULTIGRES_SCHEMA_NAME)
}

/**
 * Whether the selected project's internal `multigres` schema should be
 * hidden/filtered. Driven by `hasConnectionPooling` (false for both full
 * Multigres and Multigres Lite) rather than `isHighAvailability`, since Lite
 * also has the internal `multigres` schema despite not being HA.
 *
 * Single source of truth for this decision — use it anywhere the `multigres`
 * schema needs to be filtered or detected, not just `isHighAvailability`
 * directly, so persisted state (e.g. previously-selected exposed schemas)
 * stays consistent with the live schema list.
 */
export function useShouldHideMultigresSchema(): boolean {
  const capabilities = useProjectCapabilities()
  const isHighAvailability = useIsHighAvailability()
  // Fall back to the pre-capabilities `isHighAvailability` check (rather than
  // a fixed default) so behavior for already-correct HA/Multigres projects
  // doesn't regress while the backend capabilities field is still rolling out.
  return capabilities !== undefined
    ? capabilities.hasConnectionPooling === false
    : isHighAvailability
}

/**
 * Memoized `filterSchemasForHighAvailability` bound to the selected project's
 * capabilities. See `useShouldHideMultigresSchema` above.
 */
export function useSchemasFilteredForHighAvailability<T extends { name: string }>(
  schemas: T[] | undefined
): T[] {
  const shouldHideMultigresSchema = useShouldHideMultigresSchema()

  return useMemo(
    () => filterSchemasForHighAvailability(schemas ?? [], shouldHideMultigresSchema),
    [schemas, shouldHideMultigresSchema]
  )
}
