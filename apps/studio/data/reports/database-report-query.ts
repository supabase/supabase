import { useParams } from 'common'
import { PRESET_CONFIG } from 'components/interfaces/Reports/Reports.constants'
import { queriesFactory } from 'components/interfaces/Reports/Reports.utils'
import { DbQueryHook } from 'hooks/analytics/useDbQuery'

export const useDatabaseReport = () => {
  const { ref: projectRef } = useParams()

  const queryHooks = queriesFactory<keyof typeof PRESET_CONFIG.database.queries>(
    PRESET_CONFIG.database.queries,
    projectRef ?? 'default'
  )
  const largeObjects = queryHooks.largeObjects() as DbQueryHook
  const activeHooks = [largeObjects]

  const isLoading = activeHooks.some((hook) => hook.isLoading)

  return {
    data: {
      largeObjects: largeObjects.data,
    },
    errors: {
      largeObjects: largeObjects.error,
    },
    params: {
      largeObjects: largeObjects.params,
    },
    largeObjectsSql: largeObjects.resolvedSql,
    isLoading,
  }
}
