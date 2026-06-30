import { useQuery } from '@tanstack/react-query'
import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import {
  useCallback,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react'
import { usePreviousDistinct } from 'react-use'
import { Button, Switch } from 'ui'
import { Admonition } from 'ui-patterns/admonition'
import { Input } from 'ui-patterns/DataInputs/Input'

import { getApiEndpoint } from '@/components/interfaces/Integrations/DataApi/DataApi.utils'
import { useProjectApiUrl } from '@/data/config/project-endpoint-query'
import { defaultPrivilegesQueryOptions } from '@/data/privileges/default-privileges-query'
import { useTableApiAccessQuery } from '@/data/privileges/table-api-access-query'
import { useLoadBalancersQuery } from '@/data/read-replicas/load-balancers-query'
import { useReadReplicasQuery } from '@/data/read-replicas/replicas-query'
import { useIsSchemaExposed } from '@/hooks/misc/useIsSchemaExposed'
import { useQuerySchemaState } from '@/hooks/misc/useSchemaQueryState'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import {
  checkDataApiPrivilegesNonEmpty,
  DEFAULT_DATA_API_PRIVILEGES,
  EMPTY_DATA_API_PRIVILEGES,
  type ApiPrivilegesByRole,
} from '@/lib/data-api-types'
import { useTrack } from '@/lib/telemetry/track'
import type { DeepReadonly, Prettify } from '@/lib/type-helpers'
import { useDatabaseSelectorStateSnapshot } from '@/state/database-selector'

namespace ApiAccessToggleProps {
  type New = {
    type: 'new'
  }
  type Duplicate = {
    type: 'duplicate'
    templateSchemaName: string
    templateTableName: string
  }
  type Edit = {
    type: 'edit'
    schemaName: string
    tableName: string
  }
  export type Option = New | Duplicate | Edit
}

export type TableApiAccessParams = ApiAccessToggleProps.Option

type FetchState<T> =
  | { isError: true; isPending: false; isSuccess: false; data: undefined }
  | {
      isError: false
      isPending: true
      isSuccess: false
      data: undefined
    }
  | {
      isError: false
      isPending: false
      isSuccess: true
      data: Prettify<T>
    }

type TableApiAccessHandlerResult =
  | { schemaExposed: false }
  | {
      schemaExposed: true
      privileges: DeepReadonly<ApiPrivilegesByRole>
      setPrivileges: Dispatch<SetStateAction<DeepReadonly<ApiPrivilegesByRole>>>
    }

type TableApiAccessHandlerReturn = FetchState<TableApiAccessHandlerResult>

const useTableApiAccessHandler = (
  params: ApiAccessToggleProps.Option,
  { enabled = true } = {}
): TableApiAccessHandlerReturn => {
  const isNewTable = params.type === 'new'
  const isDuplicate = params.type === 'duplicate'
  const isExisting = params.type === 'edit'

  const { selectedSchema } = useQuerySchemaState()
  const currentTableSchema = isNewTable
    ? selectedSchema
    : isDuplicate
      ? params.templateSchemaName
      : params.schemaName

  const { data: project } = useSelectedProjectQuery({ enabled })
  const schemaExposure = useIsSchemaExposed(
    {
      projectRef: project?.ref,
      schemaName: currentTableSchema,
    },
    { enabled }
  )

  const shouldReadExistingGrants = isDuplicate || isExisting
  const permissionsTemplateSchema = !shouldReadExistingGrants
    ? undefined
    : isDuplicate
      ? params.templateSchemaName
      : params.schemaName
  const permissionsTemplateTable = !shouldReadExistingGrants
    ? undefined
    : isDuplicate
      ? params.templateTableName
      : params.tableName
  const isNewTableQuery = isNewTable && enabled
  const defaultPrivilegesQuery = useQuery(
    defaultPrivilegesQueryOptions(
      {
        projectRef: project?.ref,
        connectionString: project?.connectionString ?? undefined,
        schema: currentTableSchema,
      },
      { enabled: isNewTableQuery }
    )
  )

  const canResolvePrivilegeParams = Boolean(
    shouldReadExistingGrants &&
    project?.ref &&
    permissionsTemplateSchema &&
    permissionsTemplateTable
  )
  const isPrivilegesQueryEnabled = enabled && canResolvePrivilegeParams
  const apiAccessStatus = useTableApiAccessQuery(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString ?? undefined,
      schemaName: permissionsTemplateSchema ?? '',
      tableNames: permissionsTemplateTable ? [permissionsTemplateTable] : [],
    },
    { enabled: isPrivilegesQueryEnabled }
  )

  const privilegesForTable = permissionsTemplateTable
    ? apiAccessStatus.data?.[permissionsTemplateTable]
    : undefined

  const defaultPrivilegesEnabled = defaultPrivilegesQuery.data ?? true
  const defaultPrivilegesForNewTable = defaultPrivilegesEnabled
    ? DEFAULT_DATA_API_PRIVILEGES
    : EMPTY_DATA_API_PRIVILEGES

  const [privileges, setPrivileges] = useState<DeepReadonly<ApiPrivilegesByRole>>(
    defaultPrivilegesForNewTable
  )

  const hasLoadedInitialData = useRef(false)

  const resetState = useEffectEvent(() => {
    hasLoadedInitialData.current = !shouldReadExistingGrants
    setPrivileges(defaultPrivilegesForNewTable)
  })
  useEffect(() => {
    resetState()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- useEffectEvent fn intentionally not a dep (eslint-plugin-react-hooks v5 doesn't recognize stable useEffectEvent yet)
  }, [params.type, selectedSchema, permissionsTemplateSchema, permissionsTemplateTable])

  const syncDefaultPrivileges = useEffectEvent(() => {
    if (!isNewTable) return
    if (!defaultPrivilegesQuery.isSuccess) return
    setPrivileges(defaultPrivilegesForNewTable)
  })
  useEffect(() => {
    syncDefaultPrivileges()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- useEffectEvent fn intentionally not a dep (eslint-plugin-react-hooks v5 doesn't recognize stable useEffectEvent yet)
  }, [defaultPrivilegesQuery.status])

  const syncApiPrivileges = useEffectEvent(() => {
    if (hasLoadedInitialData.current) return
    if (!apiAccessStatus.isSuccess) return
    if (!privilegesForTable) return

    hasLoadedInitialData.current = true
    if (privilegesForTable.apiAccessType === 'access') {
      setPrivileges(privilegesForTable.privileges)
    } else if (privilegesForTable.apiAccessType === 'exposed-schema-no-grants') {
      setPrivileges(EMPTY_DATA_API_PRIVILEGES)
    } else {
      // Used as a dummy default value but is never exposed since the schema is
      // not exposed
      setPrivileges(DEFAULT_DATA_API_PRIVILEGES)
    }
  })
  useEffect(() => {
    syncApiPrivileges()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- useEffectEvent fn intentionally not a dep (eslint-plugin-react-hooks v5 doesn't recognize stable useEffectEvent yet)
  }, [apiAccessStatus.status])

  const isPending =
    !enabled ||
    schemaExposure.status === 'pending' ||
    (isNewTable && defaultPrivilegesQuery.isPending) ||
    (shouldReadExistingGrants && apiAccessStatus.isPending)
  if (isPending) {
    return { isError: false, isPending: true, isSuccess: false, data: undefined }
  }

  const isError = schemaExposure.isError || (shouldReadExistingGrants && apiAccessStatus.isError)
  if (isError) {
    return { isError: true, isPending: false, isSuccess: false, data: undefined }
  }

  const isSchemaExposed = schemaExposure.data === true
  if (!isSchemaExposed) {
    return {
      isError: false,
      isPending: false,
      isSuccess: true,
      data: { schemaExposed: false },
    }
  }

  return {
    isError: false,
    isPending: false,
    isSuccess: true,
    data: {
      schemaExposed: true,
      privileges,
      setPrivileges,
    },
  }
}

export type TableApiAccessHandlerWithHistoryReturn = FetchState<
  TableApiAccessHandlerResult & {
    clearAllPrivileges: () => void
    restorePreviousPrivileges: () => void
  }
>

export const useTableApiAccessHandlerWithHistory = (
  params: ApiAccessToggleProps.Option,
  { enabled = true } = {}
): TableApiAccessHandlerWithHistoryReturn => {
  const innerResult = useTableApiAccessHandler(params, { enabled })

  const privileges = innerResult.data?.schemaExposed ? innerResult.data.privileges : undefined
  const previous = usePreviousDistinct(privileges)

  const clearAllPrivileges = useCallback(() => {
    if (!innerResult.isSuccess) return
    if (!innerResult.data.schemaExposed) return
    innerResult.data?.setPrivileges(EMPTY_DATA_API_PRIVILEGES)
  }, [innerResult])

  const restorePreviousPrivileges = useCallback(() => {
    if (!innerResult.isSuccess) return
    if (!innerResult.data.schemaExposed) return
    innerResult.data?.setPrivileges(previous ?? DEFAULT_DATA_API_PRIVILEGES)
  }, [innerResult, previous])

  if (!innerResult.isSuccess) {
    return innerResult
  }

  return {
    ...innerResult,
    data: { ...innerResult.data, clearAllPrivileges, restorePreviousPrivileges },
  }
}

type ApiAccessToggleComponentProps = {
  projectRef?: string
  schemaName?: string
  tableName?: string
  isNewRecord: boolean
  handler: TableApiAccessHandlerWithHistoryReturn
}

export const ApiAccessToggle = ({
  projectRef,
  schemaName,
  tableName,
  isNewRecord,
  handler,
}: ApiAccessToggleComponentProps): ReactNode => {
  const track = useTrack()
  const isPending = handler.isPending
  const isError = handler.isError
  const isSchemaExposed = handler.data?.schemaExposed
  const isDisabled = isPending || isError || !isSchemaExposed

  const privileges =
    handler.isSuccess && handler.data.schemaExposed ? handler.data.privileges : undefined
  const hasNonEmptyPrivileges = checkDataApiPrivilegesNonEmpty(privileges)

  const handleMasterToggle = (checked: boolean) => {
    if (!handler.isSuccess) return
    if (!isSchemaExposed) return

    if (isNewRecord) {
      track('table_api_access_toggle_clicked', {
        newState: checked ? 'enabled' : 'disabled',
        schemaName: schemaName ?? 'unknown',
      })
    }

    if (checked) {
      handler.data?.restorePreviousPrivileges()
    } else {
      handler.data?.clearAllPrivileges()
    }
  }

  return (
    <div className="space-y-3">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h5>Data API access</h5>
            <p className="text-sm text-foreground-lighter">
              Allow this table to be queried via Supabase client libraries or the API directly
            </p>
          </div>
          {isNewRecord ? (
            <Switch
              checked={hasNonEmptyPrivileges}
              onCheckedChange={handleMasterToggle}
              disabled={isDisabled}
            />
          ) : (
            <Button asChild variant="default" icon={<ExternalLink />}>
              <Link
                target="_blank"
                rel="noopener noreferrer"
                href={`/project/${projectRef}/integrations/data_api/settings`}
              >
                Manage access
              </Link>
            </Button>
          )}
        </div>
      </div>

      <SchemaExposureOptions
        projectRef={projectRef}
        schemaName={schemaName}
        tableName={tableName}
        isPending={isPending}
        isError={isError}
        isSchemaExposed={isSchemaExposed}
      />
    </div>
  )
}

const SchemaExposureOptions = ({
  projectRef,
  schemaName,
  tableName,
  isPending,
  isError,
  isSchemaExposed,
}: {
  projectRef?: string
  schemaName?: string
  tableName?: string
  isPending: boolean
  isError: boolean
  isSchemaExposed?: boolean
}): ReactNode => {
  const { selectedDatabaseId } = useDatabaseSelectorStateSnapshot()

  const { data: resolvedEndpoint } = useProjectApiUrl({ projectRef })
  const { data: loadBalancers } = useLoadBalancersQuery({ projectRef })
  const { data: databases } = useReadReplicasQuery({ projectRef })

  const selectedDatabase = databases?.find((db) => db.identifier === selectedDatabaseId)
  const apiBaseUrl = getApiEndpoint({
    selectedDatabaseId,
    projectRef,
    resolvedEndpoint,
    loadBalancers,
    selectedDatabase,
  })

  const tablePath = !(schemaName && tableName)
    ? undefined
    : schemaName === 'public'
      ? tableName
      : `${schemaName}.${tableName}`
  const apiUrl = apiBaseUrl && tablePath ? `${apiBaseUrl}${tablePath}` : undefined

  return (
    <>
      {isError && (
        <Admonition
          type="warning"
          description="An error occurred while fetching Data API settings."
        />
      )}

      {isSchemaExposed && apiUrl && (
        <Input
          copy
          readOnly
          className="font-mono text-xs p-3 text-foreground-lighter"
          value={apiUrl}
        />
      )}

      {!isPending && !isError && !isSchemaExposed && (
        <Admonition
          type="default"
          title={`The "${schemaName}" schema is not exposed via the Data API`}
          description={
            <>
              To enable API access for this table, you need to first expose the{' '}
              <code className="text-xs">{schemaName}</code> schema in your{' '}
              <Link
                href={`/project/${projectRef}/integrations/data_api/overview`}
                className="text-foreground hover:underline"
              >
                API settings
              </Link>
              .
            </>
          }
        />
      )}
    </>
  )
}
