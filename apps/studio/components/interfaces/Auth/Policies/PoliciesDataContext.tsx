import type { PostgresPolicy } from '@supabase/postgres-meta'
import type { PropsWithChildren } from 'react'
import { createContext, useCallback, useContext, useMemo } from 'react'

import type { ResponseError } from 'types'

type TableKey = `${string}.${string}`

type PoliciesDataContextValue = {
  getPoliciesForTable: (schema: string, table: string) => PostgresPolicy[]
  isPoliciesLoading: boolean
  isPoliciesError: boolean
  policiesError?: ResponseError | Error
  exposedSchemas: Set<string>
}

const PoliciesDataContext = createContext<PoliciesDataContextValue | null>(null)

export const usePoliciesData = () => {
  const context = useContext(PoliciesDataContext)
  if (!context) throw new Error('usePoliciesData must be used within PoliciesDataProvider')
  return context
}

type PoliciesDataProviderProps = {
  policies: PostgresPolicy[]
  isPoliciesLoading: boolean
  isPoliciesError: boolean
  policiesError?: ResponseError | Error
  exposedSchemas: string[]
}

export const PoliciesDataProvider = ({
  children,
  policies,
  isPoliciesLoading,
  isPoliciesError,
  policiesError,
  exposedSchemas,
}: PropsWithChildren<PoliciesDataProviderProps>) => {
  const policiesByTable = useMemo(() => {
    const map = new Map<TableKey, PostgresPolicy[]>()

    for (const policy of policies) {
      const key = `${policy.schema}.${policy.table}` satisfies TableKey
      const existing = map.get(key)
      if (existing) {
        existing.push(policy)
      } else {
        map.set(key, [policy])
      }
    }

    for (const list of map.values()) {
      list.sort((a, b) => a.name.localeCompare(b.name))
    }

    return map
  }, [policies])

  const getPoliciesForTable = useCallback(
    (schema: string, table: string) => policiesByTable.get(`${schema}.${table}`) ?? [],
    [policiesByTable]
  )

  const exposedSchemasSet = useMemo(() => new Set(exposedSchemas), [exposedSchemas])

  const contextValue = useMemo(
    () => ({
      getPoliciesForTable,
      isPoliciesLoading,
      isPoliciesError,
      policiesError,
      exposedSchemas: exposedSchemasSet,
    }),
    [getPoliciesForTable, isPoliciesLoading, isPoliciesError, policiesError, exposedSchemasSet]
  )

  return (
    <PoliciesDataContext.Provider value={contextValue}>{children}</PoliciesDataContext.Provider>
  )
}
