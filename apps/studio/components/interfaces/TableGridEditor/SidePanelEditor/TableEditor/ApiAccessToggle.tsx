import type { PostgresTable } from '@supabase/postgres-meta'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

import { useParams } from 'common'
import { useProjectPostgrestConfigQuery } from 'data/config/project-postgrest-config-query'
import { useCustomDomainsQuery } from 'data/custom-domains/custom-domains-query'
import {
  API_ACCESS_ROLES,
  API_PRIVILEGE_TYPES,
  ApiAccessRole,
  ApiPrivilegeType,
  ApiPrivilegesPerRole,
  useTableApiAccessQuery,
} from 'data/privileges/table-api-access-query'
import { useLoadBalancersQuery } from 'data/read-replicas/load-balancers-query'
import { useReadReplicasQuery } from 'data/read-replicas/replicas-query'
import { useQuerySchemaState } from 'hooks/misc/useSchemaQueryState'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { Settings } from 'lucide-react'
import { useDatabaseSelectorStateSnapshot } from 'state/database-selector'
import { Button, PopoverContent_Shadcn_, PopoverTrigger_Shadcn_, Popover_Shadcn_, Switch } from 'ui'
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

import type { TableField } from './TableEditor.types'

interface ApiAccessToggleProps {
  table?: PostgresTable
  tableFields: TableField
  isNewRecord: boolean
  isDuplicating: boolean
  onChange?: (privileges: ApiPrivilegesPerRole) => void
  onInitialLoad?: (privileges: ApiPrivilegesPerRole) => void
}

const createDefaultRolePrivileges = (): ApiPrivilegesPerRole => ({
  anon: [...API_PRIVILEGE_TYPES],
  authenticated: [...API_PRIVILEGE_TYPES],
})

const ROLE_LABELS: Record<ApiAccessRole, string> = {
  anon: 'Anonymous (anon)',
  authenticated: 'Authenticated',
}

export const ApiAccessToggle = ({
  table,
  tableFields,
  isNewRecord,
  isDuplicating,
  onChange,
  onInitialLoad,
}: ApiAccessToggleProps) => {
  const { ref: projectRef } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const { selectedSchema } = useQuerySchemaState()
  const state = useDatabaseSelectorStateSnapshot()

  const { name: tableName } = tableFields
  const schema = table?.schema ?? selectedSchema
  const relationId = table?.id ?? tableFields.id

  const { data: postgrestConfig } = useProjectPostgrestConfigQuery({ projectRef })
  const { data: customDomainData } = useCustomDomainsQuery({ projectRef })
  const { data: databases } = useReadReplicasQuery({ projectRef })
  const { data: loadBalancers } = useLoadBalancersQuery({ projectRef })

  const exposedSchemas = useMemo(() => {
    if (!postgrestConfig?.db_schema) return []
    return postgrestConfig.db_schema.replace(/ /g, '').split(',')
  }, [postgrestConfig?.db_schema])

  const isSchemaExposed = exposedSchemas.includes(schema)

  const { data: apiAccessData, isLoading: isApiAccessLoading } = useTableApiAccessQuery(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      relationId,
      schema,
      tableName,
    },
    { enabled: !isNewRecord && !isDuplicating }
  )

  const defaultPrivileges = useMemo(createDefaultRolePrivileges, [])

  const derivedPrivileges: ApiPrivilegesPerRole =
    tableFields.apiPrivileges ?? apiAccessData?.privileges ?? defaultPrivileges

  const emptyPrivileges: ApiPrivilegesPerRole = useMemo(() => ({ anon: [], authenticated: [] }), [])

  const effectivePrivileges =
    !isSchemaExposed && (isNewRecord || isDuplicating) ? emptyPrivileges : derivedPrivileges

  // Cache last non-empty privileges so we can restore after disabling access.
  const [savedPrivileges, setSavedPrivileges] = useState<ApiPrivilegesPerRole>()

  useEffect(() => {
    if (isSchemaExposed && apiAccessData?.privileges && tableFields.apiPrivileges === undefined) {
      onInitialLoad?.(apiAccessData.privileges)
    }
  }, [apiAccessData?.privileges, isSchemaExposed, onInitialLoad, tableFields.apiPrivileges])

  // For new records or duplicating, the query is disabled so we don't need to wait for loading
  const [isPrivilegesPopoverOpen, setIsPrivilegesPopoverOpen] = useState(false)

  const isLoadingState = !isNewRecord && !isDuplicating && isApiAccessLoading
  const isDisabled = isLoadingState || !isSchemaExposed

  const isSwitchOn = Object.values(effectivePrivileges).some((privs) => privs.length > 0)

  // Keep saved privileges in sync with current non-empty selections.
  useEffect(() => {
    if (isSwitchOn) setSavedPrivileges(effectivePrivileges)
  }, [effectivePrivileges, isSwitchOn])

  const handleMasterToggle = (checked: boolean) => {
    if (!isSchemaExposed) return
    if (!checked) {
      setSavedPrivileges(effectivePrivileges)
      onChange?.({ anon: [], authenticated: [] })
    } else {
      onChange?.(savedPrivileges ?? createDefaultRolePrivileges())
    }
  }

  const handlePrivilegesChange = (role: ApiAccessRole) => (values: string[]) => {
    if (!isSchemaExposed) return
    const updatedPrivileges: ApiPrivilegesPerRole = {
      ...effectivePrivileges,
      [role]: values as ApiPrivilegeType[],
    }

    onChange?.(updatedPrivileges)
  }

  const apiEndpoint = useMemo(() => {
    const isCustomDomainActive = customDomainData?.customDomain?.status === 'active'
    const selectedDatabase = databases?.find((db) => db.identifier === state.selectedDatabaseId)
    const loadBalancerSelected = state.selectedDatabaseId === 'load-balancer'

    if (isCustomDomainActive && state.selectedDatabaseId === projectRef) {
      return `https://${customDomainData.customDomain.hostname}`
    }

    if (loadBalancerSelected) {
      return loadBalancers?.[0]?.endpoint
    }

    return selectedDatabase?.restUrl
  }, [
    customDomainData?.customDomain?.hostname,
    customDomainData?.customDomain?.status,
    databases,
    loadBalancers,
    projectRef,
    state.selectedDatabaseId,
  ])

  const apiBaseUrl = useMemo(() => {
    if (!apiEndpoint) return undefined
    return apiEndpoint.endsWith('/') ? apiEndpoint.slice(0, -1) : apiEndpoint
  }, [apiEndpoint])

  const tablePath =
    schema && schema !== 'public' ? `${schema}.${tableName}` : tableName ?? table?.name ?? ''

  const apiUrl = apiBaseUrl && tablePath ? `${apiBaseUrl}/${tablePath}` : undefined

  const hasAnyPrivileges = Object.values(effectivePrivileges).some(
    (privileges) => privileges.length
  )
  const totalAvailablePrivileges = API_ACCESS_ROLES.length * API_PRIVILEGE_TYPES.length
  const totalSelectedPrivileges = Object.values(effectivePrivileges).reduce(
    (acc, privileges) => acc + privileges.length,
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
                This controls which operations the <code className="text-xs">anon</code> and{' '}
                <code className="text-xs">authenticated</code> roles can perform on this table via
                the Data API. Unselected privileges are revoked from these roles.
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
              <PopoverTrigger_Shadcn_ asChild>
                <Button type="text" className="w-6 h-6 p-0 text-foreground-light">
                  <Settings strokeWidth={1.5} size={16} />
                  {hasPartialPrivileges && (
                    <span className="absolute right-0 top-0 h-1.5 w-1.5 rounded-full bg-foreground shadow-sm" />
                  )}
                </Button>
              </PopoverTrigger_Shadcn_>
              <PopoverContent_Shadcn_ align="end" className="w-[420px] space-y-3">
                <p className="text-sm text-foreground">Adjust API privileges per role</p>
                <div className="space-y-2">
                  {API_ACCESS_ROLES.map((role) => (
                    <div key={role} className="space-y-2">
                      <p className="text-sm text-foreground flex items-center gap-1.5">
                        {ROLE_LABELS[role]}
                      </p>
                      <MultiSelector
                        values={effectivePrivileges[role]}
                        onValuesChange={handlePrivilegesChange(role)}
                        disabled={isDisabled}
                      >
                        <MultiSelectorTrigger
                          label="Select privileges"
                          badgeLimit={4}
                          deletableBadge={!isDisabled}
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
              </PopoverContent_Shadcn_>
            </Popover_Shadcn_>
            <Switch
              checked={isSwitchOn}
              onCheckedChange={handleMasterToggle}
              disabled={isDisabled}
            />
          </div>
        </div>
      </div>

      {isSchemaExposed && apiUrl && hasAnyPrivileges && (
        <Input
          copy
          readOnly
          className="font-mono text-xs p-3 text-foreground-lighter"
          value={apiUrl}
        />
      )}

      {!isSchemaExposed && (
        <Admonition
          type="default"
          title={`The "${schema}" schema is not exposed via the Data API`}
          description={
            <>
              To enable API access for this table, you need to first expose the{' '}
              <code className="text-xs">{schema}</code> schema in your{' '}
              <Link
                href={`/project/${projectRef}/settings/api`}
                className="text-foreground hover:underline"
              >
                API settings
              </Link>
              .
            </>
          }
        />
      )}
    </div>
  )
}
