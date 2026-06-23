import {
  getHighAvailabilityDisabledDescription,
  getHighAvailabilityDisabledTitle,
  getHighAvailabilityDisabledTooltip,
  HIGH_AVAILABILITY_DISABLED_MESSAGES,
  HIGH_AVAILABILITY_REPLICATION_DISABLED_MESSAGES,
  MULTIGRES_SCHEMA_NAME,
  resolveHighAvailability,
} from './useHighAvailability.constants'
import { useSelectedProjectQuery } from './useSelectedProject'

export {
  HIGH_AVAILABILITY_DISABLED_MESSAGES,
  HIGH_AVAILABILITY_REPLICATION_DISABLED_MESSAGES,
  MULTIGRES_SCHEMA_NAME,
  getHighAvailabilityDisabledDescription,
  getHighAvailabilityDisabledTitle,
  getHighAvailabilityDisabledTooltip,
  resolveHighAvailability,
}

export function useHighAvailability() {
  const { data: project, isPending } = useSelectedProjectQuery()

  const isHighAvailability = resolveHighAvailability(project)
  const isHighAvailabilityDisabled = !isHighAvailability

  return {
    isHighAvailability,
    isHighAvailabilityDisabled,
    isPending,
    disabledTitle: HIGH_AVAILABILITY_DISABLED_MESSAGES.title,
    disabledDescription: HIGH_AVAILABILITY_DISABLED_MESSAGES.description,
    sectionDisabledTooltip: HIGH_AVAILABILITY_DISABLED_MESSAGES.sectionTooltip,
  }
}

export function filterSchemasForHighAvailability<T extends { name: string }>(
  schemas: T[],
  isHighAvailability: boolean
) {
  if (!isHighAvailability) return schemas

  return schemas.filter((schema) => schema.name !== MULTIGRES_SCHEMA_NAME)
}
