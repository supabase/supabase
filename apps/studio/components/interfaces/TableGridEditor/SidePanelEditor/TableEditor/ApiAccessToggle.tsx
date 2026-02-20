import { Settings } from 'lucide-react'
import Link from 'next/link'
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react'
import { usePreviousDistinct } from 'react-use'

import { useTableApiAccessQuery } from '@/data/privileges/table-api-access-query'
import { useStaticEffectEvent } from '@/hooks/useStaticEffectEvent'
import {
  API_ACCESS_ROLES,
  API_PRIVILEGE_TYPES,
  checkDataApiPrivilegesNonEmpty,
  DEFAULT_DATA_API_PRIVILEGES,
  EMPTY_DATA_API_PRIVILEGES,
  isApiPrivilegeType,
  type ApiAccessRole,
  type ApiPrivilegesByRole,
} from '@/lib/data-api-types'
import type { DeepReadonly, Prettify } from '@/lib/type-helpers'
import { useDatabaseSelectorStateSnapshot } from '@/state/database-selector'
import { useCustomDomainsQuery } from 'data/custom-domains/custom-domains-query'
import { useLoadBalancersQuery } from 'data/read-replicas/load-balancers-query'
import { useReadReplicasQuery } from 'data/read-replicas/replicas-query'
import { useIsSchemaExposed } from 'hooks/misc/useIsSchemaExposed'
import { useQuerySchemaState } from 'hooks/misc/useSchemaQueryState'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { Button, Popover_Shadcn_, PopoverContent_Shadcn_, PopoverTrigger_Shadcn_, Switch } from 'ui'
import { Admonition } from 'ui-patterns'
import { Input } from 'ui-patterns/DataInputs/Input'
import { InfoTooltip } from 'ui-patterns/info-tooltip'
import {
  MultiSelector,
  MultiSelectorContent,
  MultiSelectorItem,
  MultiSelectorList,
  MultiSelectorTrigger,
} from 'ui-patterns/multi-select'

const ROLE_LABELS: Record<ApiAccessRole, string> = {
  anon: 'Anonymous (anon)',
  authenticated: 'Authenticated',
}

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

  const [privileges, setPrivileges] = useState<DeepReadonly<ApiPrivilegesByRole>>(
    DEFAULT_DATA_API_PRIVILEGES
  )

  const hasLoadedInitialData = useRef(false)

  const resetState = useStaticEffectEvent(() => {
    hasLoadedInitialData.current = !shouldReadExistingGrants
    setPrivileges(DEFAULT_DATA_API_PRIVILEGES)
  })
  useEffect(() => {
    resetState()
  }, [params.type, selectedSchema, permissionsTemplateSchema, permissionsTemplateTable, resetState])

  const syncApiPrivileges = useStaticEffectEvent(() => {
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
  }, [apiAccessStatus.status, syncApiPrivileges])

  const isPending =
    !enabled ||
    schemaExposure.status === 'pending' ||
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

  const clearAllPrivileges = useStaticEffectEvent(() => {
    if (!innerResult.isSuccess) return
    if (!innerResult.data.schemaExposed) return
    innerResult.data?.setPrivileges(EMPTY_DATA_API_PRIVILEGES)
  })

  const restorePreviousPrivileges = useStaticEffectEvent(() => {
    if (!innerResult.isSuccess) return
    if (!innerResult.data.schemaExposed) return
    innerResult.data?.setPrivileges(previous ?? DEFAULT_DATA_API_PRIVILEGES)
  })

  if (!innerResult.isSuccess) {
    return innerResult
  }

  return {
    ...innerResult,
    data: { ...innerResult.data, clearAllPrivileges, restorePreviousPrivileges },
  }
}

type ApiAccessToggleProps = {
  projectRef?: string
  schemaName?: string
  tableName?: string
  handler: TableApiAccessHandlerWithHistoryReturn
}

export const ApiAccessToggle = ({
  projectRef,
  schemaName,
  tableName,
  handler,
}: ApiAccessToggleProps): ReactNode => {
  const [isPrivilegesPopoverOpen, setIsPrivilegesPopoverOpen] = useState(false)

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

    if (checked) {
      handler.data?.restorePreviousPrivileges()
    } else {
      handler.data?.clearAllPrivileges()
    }
  }

  const handlePrivilegesChange = (role: ApiAccessRole) => (values: string[]) => {
    if (!handler.isSuccess) return
    if (!isSchemaExposed) return
    if (!privileges) return

    handler.data?.setPrivileges((oldPrivileges) => {
      return {
        ...oldPrivileges,
        [role]: values.filter(isApiPrivilegeType),
      }
    })
  }

  const totalAvailablePrivileges = API_ACCESS_ROLES.length * API_PRIVILEGE_TYPES.length
  const totalSelectedPrivileges = Object.values(privileges ?? {}).reduce(
    (sum, rolePrivileges) => sum + rolePrivileges.length,
    0
  )
  const hasPartialPrivileges =
    totalSelectedPrivileges > 0 && totalSelectedPrivileges < totalAvailablePrivileges

  return (
    <div className="space-y-3">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="text-sm text-foreground flex items-center gap-1.5">
              Data API Access
              <InfoTooltip side="top" className="max-w-80">
                This controls which operations the <code className="text-code-inline">anon</code>{' '}
                and <code className="text-code-inline whitespace-nowrap">authenticated</code> roles
                can perform on this table via the Data API. Unselected privileges are revoked from
                these roles.
              </InfoTooltip>
            </p>
            <p className="text-sm text-foreground-lighter">
              Allow this table to be queried via Supabase client libraries or the API directly
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Popover_Shadcn_
              open={isPrivilegesPopoverOpen}
              onOpenChange={setIsPrivilegesPopoverOpen}
            >
              <PopoverTrigger_Shadcn_ asChild disabled={isDisabled || !hasNonEmptyPrivileges}>
                <Button
                  type="text"
                  className="w-6 h-6 p-0 text-foreground-light"
                  aria-label="Configure API privileges"
                >
                  <Settings strokeWidth={1.5} size={16} />
                  {hasPartialPrivileges && (
                    <span className="absolute right-0 top-0 h-1.5 w-1.5 rounded-full bg-foreground shadow-sm" />
                  )}
                </Button>
              </PopoverTrigger_Shadcn_>
              <PopoverContent_Shadcn_ align="end" className="w-[420px] space-y-3">
                {!isDisabled && (
                  <>
                    <p className="text-sm text-foreground">Adjust API privileges per role</p>
                    <div className="space-y-2">
                      {API_ACCESS_ROLES.map((role) => (
                        <div key={role} className="space-y-2">
                          <p className="text-sm text-foreground flex items-center gap-1.5">
                            {ROLE_LABELS[role]}
                          </p>
                          <MultiSelector
                            values={(privileges?.[role] as string[]) ?? []}
                            onValuesChange={handlePrivilegesChange(role)}
                          >
                            <MultiSelectorTrigger
                              label="Select privileges"
                              badgeLimit={4}
                              deletableBadge={true}
                            />
                            <MultiSelectorContent>
                              <MultiSelectorList>
                                {API_PRIVILEGE_TYPES.map((privilege) => (
                                  <MultiSelectorItem key={privilege} value={privilege}>
                                    {privilege}
                                  </MultiSelectorItem>
                                ))}
                              </MultiSelectorList>
                            </MultiSelectorContent>
                          </MultiSelector>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </PopoverContent_Shadcn_>
            </Popover_Shadcn_>
            <Switch
              checked={hasNonEmptyPrivileges}
              onCheckedChange={handleMasterToggle}
              disabled={isDisabled}
            />
          </div>
        </div>
      </div>
      <SchemaExposureOptions
        projectRef={projectRef}
        schemaName={schemaName}
        tableName={tableName}
        isPending={isPending}
        isError={isError}
        isSchemaExposed={isSchemaExposed}
        hasNonEmptyPrivileges={!!privileges ? hasNonEmptyPrivileges : undefined}
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
  hasNonEmptyPrivileges,
}: {
  projectRef?: string
  schemaName?: string
  tableName?: string
  isPending: boolean
  isError: boolean
  isSchemaExposed?: boolean
  hasNonEmptyPrivileges?: boolean
}): ReactNode => {
  const { selectedDatabaseId } = useDatabaseSelectorStateSnapshot()

  const { data: customDomainData } = useCustomDomainsQuery({ projectRef })
  const { data: loadBalancers } = useLoadBalancersQuery({ projectRef })
  const { data: databases } = useReadReplicasQuery({ projectRef })

  const apiEndpoint = useMemo(() => {
    const isCustomDomainActive = customDomainData?.customDomain?.status === 'active'
    if (isCustomDomainActive && selectedDatabaseId === projectRef) {
      return `https://${customDomainData.customDomain.hostname}`
    }

    const loadBalancerSelected = selectedDatabaseId === 'load-balancer'
    if (loadBalancerSelected) {
      return loadBalancers?.[0]?.endpoint
    }

    const selectedDatabase = databases?.find((db) => db.identifier === selectedDatabaseId)
    return selectedDatabase?.restUrl
  }, [
    projectRef,
    databases,
    selectedDatabaseId,
    customDomainData?.customDomain?.status,
    customDomainData?.customDomain?.hostname,
    loadBalancers,
  ])
  const apiBaseUrl = useMemo(() => {
    if (!apiEndpoint) return undefined
    return apiEndpoint.endsWith('/') ? apiEndpoint.slice(0, -1) : apiEndpoint
  }, [apiEndpoint])

  const tablePath = !(schemaName && tableName)
    ? undefined
    : schemaName === 'public'
      ? tableName
      : `${schemaName}.${tableName}`
  const apiUrl = apiBaseUrl && tablePath ? `${apiBaseUrl}/${tablePath}` : undefined

  return (
    <>
      {isError && (
        <Admonition type="warning" title="An error occurred while fetching Data API settings." />
      )}

      {isSchemaExposed && apiUrl && hasNonEmptyPrivileges && (
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
