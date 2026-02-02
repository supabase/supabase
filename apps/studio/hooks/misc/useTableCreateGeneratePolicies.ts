import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { useTrackExperimentExposure } from 'hooks/misc/useTrackExperimentExposure'
import { usePHFlag } from 'hooks/ui/useFlag'
import { IS_PLATFORM } from 'lib/constants'
import { useMemo } from 'react'

dayjs.extend(utc)

export type TableCreateGeneratePoliciesVariant = 'control' | 'variation'

const VALID_VARIANTS: TableCreateGeneratePoliciesVariant[] = ['control', 'variation']

export function isValidExperimentVariant(
  value: unknown
): value is TableCreateGeneratePoliciesVariant {
  return (
    typeof value === 'string' &&
    VALID_VARIANTS.includes(value as TableCreateGeneratePoliciesVariant)
  )
}

interface UseTableCreateGeneratePoliciesOptions {
  /**
   * Whether this is a new table being created
   */
  isNewRecord?: boolean
  /**
   * Project creation timestamp
   */
  projectInsertedAt?: string
}

interface UseTableCreateGeneratePoliciesResult {
  /**
   * Whether the generate policies feature is enabled
   */
  enabled: boolean
}

/**
 * Hook to manage the table create generate policies feature flag.
 * Handles feature flag determination and exposure tracking.
 *
 * @param options Configuration for feature targeting
 * @returns Feature state including whether it's enabled
 */
export function useTableCreateGeneratePolicies({
  isNewRecord = false,
  projectInsertedAt,
}: UseTableCreateGeneratePoliciesOptions): UseTableCreateGeneratePoliciesResult {
  const tableCreateGeneratePoliciesFlag = usePHFlag<string>('tableCreateGeneratePolicies')

  const enabled = useMemo(() => {
    if (!IS_PLATFORM) return false
    if (tableCreateGeneratePoliciesFlag !== 'variation') return false
    return true
  }, [tableCreateGeneratePoliciesFlag])

  const daysSinceCreation = useMemo(() => {
    if (!projectInsertedAt) return undefined
    const insertedDate = dayjs.utc(projectInsertedAt)
    if (!insertedDate.isValid()) return undefined
    return dayjs.utc().diff(insertedDate, 'day')
  }, [projectInsertedAt])

  const shouldTrack =
    IS_PLATFORM &&
    isNewRecord &&
    isValidExperimentVariant(tableCreateGeneratePoliciesFlag) &&
    daysSinceCreation !== undefined

  useTrackExperimentExposure(
    'table_create_generate_policies',
    shouldTrack ? tableCreateGeneratePoliciesFlag : undefined,
    { days_since_project_creation: daysSinceCreation }
  )

  return {
    enabled,
  }
}
