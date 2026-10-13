import { useMemo } from 'react'

import { MULTIGRES_SCHEMA_NAME, resolveHighAvailability } from './useHighAvailability.constants'
import { useIsHighAvailability, useSelectedProjectQuery } from './useSelectedProject'
import { IS_STAGING_OR_LOCAL } from '@/lib/constants'

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
 * Realtime (and the publications it relies on) is only available on High
 * Availability projects in staging and local environments while it is being
 * validated there. Whether a project is actually registered as a Realtime
 * tenant is decided by the platform.
 */
export function resolveRealtimeUnavailable(
  isHighAvailability: boolean,
  isHighAvailabilityRealtimeAvailable = IS_STAGING_OR_LOCAL
) {
  return isHighAvailability && !isHighAvailabilityRealtimeAvailable
}

export function useIsRealtimeUnavailable() {
  const { isHighAvailability, isPending } = useHighAvailability()

  return {
    isRealtimeUnavailable: resolveRealtimeUnavailable(isHighAvailability),
    isPending,
  }
}

export function filterSchemasForHighAvailability<T extends { name: string }>(
  schemas: T[],
  isHighAvailability: boolean
) {
  if (!isHighAvailability) return schemas

  return schemas.filter((schema) => schema.name !== MULTIGRES_SCHEMA_NAME)
}

/**
 * Memoized `filterSchemasForHighAvailability` bound to the selected project's
 * high availability state.
 */
export function useSchemasFilteredForHighAvailability<T extends { name: string }>(
  schemas: T[] | undefined
): T[] {
  const { isHighAvailability } = useHighAvailability()

  return useMemo(
    () => filterSchemasForHighAvailability(schemas ?? [], isHighAvailability),
    [schemas, isHighAvailability]
  )
}
