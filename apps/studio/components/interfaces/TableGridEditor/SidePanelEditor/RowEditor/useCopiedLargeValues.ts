import type { PGTable } from '@supabase/pg-meta'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import type { LargeValueStatus } from './RowEditor.types'
import { useRowLargeValuesQuery } from '@/data/table-rows/row-large-values-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import type { RoleImpersonationState } from '@/lib/role-impersonation'
import { useRoleImpersonationStateSnapshot } from '@/state/role-impersonation-state'
import type { Dictionary } from '@/types'

type Request = { columns: string[]; pkMatch: Record<string, unknown> }

const statusForAll = (columns: string[], status: LargeValueStatus) =>
  Object.fromEntries(columns.map((column) => [column, status]))

/**
 * Fetches the full values of columns the grid truncated, so a copy of a row (e.g. Duplicate row)
 * can include them. Tracks per column whether the value is still loading or couldn't be copied.
 */
export const useCopiedLargeValues = ({
  table,
  onValuesLoaded,
}: {
  table: PGTable
  onValuesLoaded: (values: Dictionary<unknown>) => void
}) => {
  const { data: project } = useSelectedProjectQuery()
  const roleImpersonationState = useRoleImpersonationStateSnapshot()

  const [request, setRequest] = useState<Request>()
  const [statuses, setStatuses] = useState<Dictionary<LargeValueStatus>>({})

  const { data, error, isFetching } = useRowLargeValuesQuery(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      table: { schema: table.schema, name: table.name },
      columns: request?.columns ?? [],
      pkMatch: request?.pkMatch ?? {},
      roleImpersonationState: roleImpersonationState as RoleImpersonationState,
    },
    { enabled: request !== undefined }
  )

  // Each request is handled once, then cleared, so a later render can't merge stale values over edits
  useEffect(() => {
    if (request === undefined || data === undefined || isFetching) return

    onValuesLoaded(data)
    const tooLarge = request.columns.filter((column) => data[column] == null)
    setStatuses(statusForAll(tooLarge, 'too-large'))
    setRequest(undefined)
  }, [request, data, isFetching, onValuesLoaded])

  useEffect(() => {
    if (request === undefined || error === null) return

    toast.error(`Failed to load large values for the copy: ${error.message}`)
    setStatuses(statusForAll(request.columns, 'failed'))
    setRequest(undefined)
  }, [request, error])

  /** Start fetching the given columns of a row. Does nothing visible when there are none. */
  const load = ({
    columns,
    pkMatch,
  }: {
    columns: string[]
    pkMatch: Record<string, unknown> | undefined
  }) => {
    if (columns.length === 0) {
      setRequest(undefined)
      setStatuses({})
    } else if (pkMatch === undefined) {
      setRequest(undefined)
      setStatuses(statusForAll(columns, 'no-primary-key'))
    } else {
      setRequest({ columns, pkMatch })
      setStatuses(statusForAll(columns, 'loading'))
    }
  }

  const reset = () => {
    setRequest(undefined)
    setStatuses({})
  }

  return {
    statuses,
    isLoading: Object.values(statuses).includes('loading'),
    load,
    reset,
  }
}
