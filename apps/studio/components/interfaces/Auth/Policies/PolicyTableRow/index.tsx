import type { PostgresPolicy } from '@supabase/postgres-meta'
import { noop } from 'lodash'
import { memo, useMemo } from 'react'

import { useParams } from 'common'
import AlertError from 'components/ui/AlertError'
import { InlineLink } from 'components/ui/InlineLink'
import { useTablesRolesAccessQuery } from 'data/tables/tables-roles-access-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import {
  Card,
  CardContent,
  CardHeader,
  cn,
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui'
import { Admonition } from 'ui-patterns'
import ShimmeringLoader from 'ui-patterns/ShimmeringLoader'
import { usePoliciesData } from '../PoliciesDataContext'
import { PolicyRow } from './PolicyRow'
import type { PolicyTable } from './PolicyTableRow.types'
import { PolicyTableRowHeader } from './PolicyTableRowHeader'

export interface PolicyTableRowProps {
  table: PolicyTable
  isLocked: boolean
  onSelectToggleRLS: (table: PolicyTable) => void
  onSelectCreatePolicy: (table: PolicyTable) => void
  onSelectEditPolicy: (policy: PostgresPolicy) => void
  onSelectDeletePolicy: (policy: PostgresPolicy) => void
}

const PolicyTableRowComponent = ({
  table,
  isLocked,
  onSelectToggleRLS = noop,
  onSelectCreatePolicy = noop,
  onSelectEditPolicy = noop,
  onSelectDeletePolicy = noop,
}: PolicyTableRowProps) => {
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const { getPoliciesForTable, isPoliciesLoading, isPoliciesError, policiesError, exposedSchemas } =
    usePoliciesData()

  const policies = useMemo(
    () => getPoliciesForTable(table.schema, table.name),
    [getPoliciesForTable, table.schema, table.name]
  )

  // [Joshen] Changes here are so that warnings are more accurate and granular instead of purely relying if RLS is disabled or enabled
  // The following scenarios are technically okay if the table has RLS disabled, in which it won't be publicly readable / writable
  // - If the schema is not exposed through the API via Postgrest
  // - If the anon and authenticated roles do not have access to the table
  // Ideally we should just rely on the security lints as the source of truth, but the security lints currently have limitations
  // - They only consider the public schema
  // - They do not consider roles
  // Eventually if the security lints are able to cover those, we can look to using them as the source of truth instead then
  const isRLSEnabled = table.rls_enabled
  const isTableExposedThroughAPI = useMemo(
    () => exposedSchemas.has(table.schema),
    [exposedSchemas, table.schema]
  )

  const { data: tablesWithAnonAuthAccess = new Set() } = useTablesRolesAccessQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    schema: table.schema,
  })

  const hasAnonAuthenticatedRolesAccess = tablesWithAnonAuthAccess.has(table.name)
  const isPubliclyReadableWritable =
    !isRLSEnabled && isTableExposedThroughAPI && hasAnonAuthenticatedRolesAccess
  const rlsEnabledNoPolicies = isRLSEnabled && policies.length === 0
  const isRealtimeSchema = table.schema === 'realtime'
  const isRealtimeMessagesTable = isRealtimeSchema && table.name === 'messages'
  const isTableLocked = isRealtimeSchema ? !isRealtimeMessagesTable : isLocked

  const showPolicies = !isPoliciesLoading && !isPoliciesError

  return (
    <Card className={cn(isPubliclyReadableWritable && 'border-warning-500')}>
      <CardHeader
        className={cn(
          'py-3 px-4',
          (isPubliclyReadableWritable || rlsEnabledNoPolicies || !isTableExposedThroughAPI) &&
            'border-b-0'
        )}
      >
        <PolicyTableRowHeader
          table={table}
          isLocked={isLocked}
          onSelectToggleRLS={onSelectToggleRLS}
          onSelectCreatePolicy={onSelectCreatePolicy}
        />
      </CardHeader>

      {!isTableExposedThroughAPI && (
        <Admonition
          showIcon={false}
          type="warning"
          className="border-0 border-y rounded-none min-h-12 flex items-center"
        >
          <p className="text-foreground-light">
            No data will be selectable via Supabase APIs as this schema is not exposed. You may
            configure this in your project’s{' '}
            <InlineLink href={`/project/${ref}/settings/api`}>API settings</InlineLink>.
          </p>
        </Admonition>
      )}

      {(isPubliclyReadableWritable || rlsEnabledNoPolicies) && isTableExposedThroughAPI && (
        <Admonition
          showIcon={false}
          type={isPubliclyReadableWritable ? 'warning' : 'default'}
          className="border-0 border-y rounded-none min-h-12 flex items-center"
        >
          <p>
            {isPubliclyReadableWritable
              ? 'Anyone with your project’s anonymous key can read, modify, or delete your data.'
              : 'No data will be selectable via Supabase APIs because RLS is enabled but no policies have been created yet.'}
          </p>
        </Admonition>
      )}

      {isPoliciesLoading && (
        <CardContent>
          <ShimmeringLoader />
        </CardContent>
      )}

      {isPoliciesError && (
        <CardContent>
          <AlertError
            className="border-0 rounded-none"
            error={policiesError}
            subject="Failed to retrieve policies"
          />
        </CardContent>
      )}

      {showPolicies && (
        <CardContent className="p-0">
          {policies.length === 0 ? (
            <p className="text-foreground-lighter text-sm p-4">No policies created yet</p>
          ) : (
            <Table className="table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">Name</TableHead>
                  <TableHead className="w-[20%]">Command</TableHead>
                  <TableHead className="w-[30%]">Applied to</TableHead>
                  <TableHead className="text-right">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {policies.map((policy) => (
                  <PolicyRow
                    key={policy.id}
                    policy={policy}
                    isLocked={isTableLocked}
                    onSelectEditPolicy={onSelectEditPolicy}
                    onSelectDeletePolicy={onSelectDeletePolicy}
                  />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      )}
    </Card>
  )
}

export const PolicyTableRow = memo(PolicyTableRowComponent)
PolicyTableRow.displayName = 'PolicyTableRow'
