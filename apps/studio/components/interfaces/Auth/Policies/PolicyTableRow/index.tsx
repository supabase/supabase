import type { PostgresPolicy } from '@supabase/postgres-meta'
import { noop } from 'lodash'
import { Info } from 'lucide-react'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import AlertError from 'components/ui/AlertError'
import Panel from 'components/ui/Panel'
import { useProjectPostgrestConfigQuery } from 'data/config/project-postgrest-config-query'
import { useDatabasePoliciesQuery } from 'data/database-policies/database-policies-query'
import { useTableRolesAccessQuery } from 'data/tables/table-roles-access-query'
import { cn, Tooltip, TooltipContent, TooltipTrigger } from 'ui'
import ShimmeringLoader from 'ui-patterns/ShimmeringLoader'
import PolicyRow from './PolicyRow'
import PolicyTableRowHeader from './PolicyTableRowHeader'

export interface PolicyTableRowProps {
  table: {
    id: number
    schema: string
    name: string
    rls_enabled: boolean
  }
  isLocked: boolean
  onSelectToggleRLS: (table: {
    id: number
    schema: string
    name: string
    rls_enabled: boolean
  }) => void
  onSelectCreatePolicy: () => void
  onSelectEditPolicy: (policy: PostgresPolicy) => void
  onSelectDeletePolicy: (policy: PostgresPolicy) => void
}

export const PolicyTableRow = ({
  table,
  isLocked,
  onSelectToggleRLS = noop,
  onSelectCreatePolicy,
  onSelectEditPolicy = noop,
  onSelectDeletePolicy = noop,
}: PolicyTableRowProps) => {
  const { project } = useProjectContext()

  // [Joshen] Changes here are so that warnings are more accurate and granular instead of purely relying if RLS is disabled or enabled
  // The following scenarios are technically okay if the table has RLS disabled, in which it won't be publicly readable / writable
  // - If the schema is not exposed through the API via Postgrest
  // - If the anon and authenticated roles do not have access to the table
  // Ideally we should just rely on the security lints as the source of truth, but the security lints currently have limitations
  // - They only consider the public schema
  // - They do not consider roles
  // Eventually if the security lints are able to cover those, we can look to using them as the source of truth instead then
  const { data: config } = useProjectPostgrestConfigQuery({ projectRef: project?.ref })
  const exposedSchemas = config?.db_schema ? config?.db_schema.replace(/ /g, '').split(',') : []
  const isRLSEnabled = table.rls_enabled
  const isTableExposedThroughAPI = exposedSchemas.includes(table.schema)

  const { data: roles = [] } = useTableRolesAccessQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    schema: table.schema,
    table: table.name,
  })
  const hasAnonAuthenticatedRolesAccess = roles.length !== 0
  const isPubliclyReadableWritable =
    !isRLSEnabled && isTableExposedThroughAPI && hasAnonAuthenticatedRolesAccess

  const { data, error, isLoading, isError, isSuccess } = useDatabasePoliciesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const policies = (data ?? [])
    .filter((policy) => policy.schema === table.schema && policy.table === table.name)
    .sort((a, b) => a.name.localeCompare(b.name))
  const rlsEnabledNoPolicies = isRLSEnabled && policies.length === 0

  return (
    <Panel
      className="!m-0"
      title={
        <PolicyTableRowHeader
          table={table}
          isLocked={isLocked}
          onSelectToggleRLS={onSelectToggleRLS}
          onSelectCreatePolicy={onSelectCreatePolicy}
        />
      }
    >
      {(isPubliclyReadableWritable || rlsEnabledNoPolicies) && (
        <div
          className={cn(
            'dark:bg-alternative-200 bg-surface-200 px-6 py-2 text-xs flex items-center gap-2',
            policies.length === 0 ? '' : 'border-b'
          )}
        >
          <div
            className={cn(
              'w-1.5 h-1.5 rounded-full bg-warning-600 ',
              rlsEnabledNoPolicies && 'bg-selection'
            )}
          />
          <span
            className={cn('font-bold text-warning-600', rlsEnabledNoPolicies && 'text-foreground')}
          >
            {isPubliclyReadableWritable ? 'Warning' : 'Note'}:
          </span>{' '}
          <span className="text-foreground-light">
            {isPubliclyReadableWritable
              ? 'Row Level Security is disabled. Your table is publicly readable and writable.'
              : 'Row Level Security is enabled, but no policies exist. No data will be selectable via Supabase APIs.'}
          </span>
          {isPubliclyReadableWritable && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-3 h-3" />
              </TooltipTrigger>
              <TooltipContent className="w-[400px]">
                Anyone with the project's anonymous key can modify or delete your data. Enable RLS
                and create access policies to keep your data secure.
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      )}
      {isLoading && (
        <div className="px-6 py-4">
          <ShimmeringLoader />
        </div>
      )}
      {isError && (
        <AlertError
          className="border-0 rounded-none"
          error={error}
          subject="Failed to retrieve policies"
        />
      )}
      {isSuccess && (
        <>
          {policies.length === 0 && (
            <div className="px-6 py-4 flex flex-col gap-y-3">
              <p className="text-foreground-lighter text-sm">No policies created yet</p>
            </div>
          )}
          {policies?.map((policy) => (
            <PolicyRow
              key={policy.id}
              isLocked={isLocked}
              policy={policy}
              onSelectEditPolicy={onSelectEditPolicy}
              onSelectDeletePolicy={onSelectDeletePolicy}
            />
          ))}
        </>
      )}
    </Panel>
  )
}
