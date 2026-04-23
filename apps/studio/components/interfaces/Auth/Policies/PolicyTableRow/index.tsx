import type { PostgresPolicy } from '@supabase/postgres-meta'
import { useParams } from 'common'
import { noop } from 'lodash'
import { memo, useMemo } from 'react'
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
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { usePoliciesData } from '../PoliciesDataContext'
import { PolicyRow } from './PolicyRow'
import type { PolicyTable } from './PolicyTableRow.types'
import { getTableAdmonitionMessage, getTableDataApiStatus } from './PolicyTableRow.utils'
import { PolicyTableRowHeader } from './PolicyTableRowHeader'
import AlertError from '@/components/ui/AlertError'
import { InlineLink } from '@/components/ui/InlineLink'
import { useTableApiAccessQuery } from '@/data/privileges/table-api-access-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

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

  // [Joshen] Classification is more granular than "RLS on/off" alone — it also considers
  // schema exposure and whether anon/authenticated/service_role actually have grants.
  // Ideally we'd rely on the security lints, but they only look at the public schema and
  // ignore roles. Once the lints cover both, we can switch to them as the source of truth.
  const tableNames = useMemo(() => [table.name], [table.name])
  const {
    data: apiAccessMap,
    isPending: isLoadingRolesAccess,
    isError: isRolesAccessError,
  } = useTableApiAccessQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    schemaName: table.schema,
    tableNames,
  })

  const status = useMemo(
    () =>
      getTableDataApiStatus({
        isSchemaExposed: exposedSchemas.has(table.schema),
        apiAccessData: apiAccessMap?.[table.name],
        isRLSEnabled: table.rls_enabled,
        policiesCount: policies.length,
      }),
    [exposedSchemas, apiAccessMap, table.schema, table.name, table.rls_enabled, policies.length]
  )

  const hasApiAccess =
    status === 'publicly-readable' || status === 'locked-by-rls' || status === 'secured'
  const isPubliclyReadable = status === 'publicly-readable'

  const isRealtimeSchema = table.schema === 'realtime'
  const isRealtimeMessagesTable = isRealtimeSchema && table.name === 'messages'
  const isTableLocked = isRealtimeSchema ? !isRealtimeMessagesTable : isLocked

  const showPolicies = !isPoliciesLoading && !isPoliciesError && !isLoadingRolesAccess

  const admonitionMessage = useMemo(() => getTableAdmonitionMessage(status), [status])

  return (
    <Card className={cn(isPubliclyReadable && 'border-warning-500')}>
      <CardHeader className={cn('py-3 px-4', status !== 'secured' && 'border-b-0')}>
        <PolicyTableRowHeader
          table={table}
          isLocked={isLocked}
          hasApiAccess={hasApiAccess}
          isLoadingApiAccess={isLoadingRolesAccess}
          onSelectToggleRLS={onSelectToggleRLS}
          onSelectCreatePolicy={onSelectCreatePolicy}
        />
      </CardHeader>

      {!isLoadingRolesAccess && !isRolesAccessError && status === 'schema-not-exposed' && (
        <Admonition
          showIcon={false}
          type="warning"
          className="border-0 border-y rounded-none min-h-12 flex items-center"
        >
          <p className="text-foreground-light">
            No data will be selectable via Supabase APIs as this schema is not exposed. You may
            configure this in your project’s{' '}
            <InlineLink href={`/project/${ref}/integrations/data_api/settings`}>
              API settings
            </InlineLink>
            .
          </p>
        </Admonition>
      )}

      {!isLoadingRolesAccess && !isRolesAccessError && admonitionMessage !== null && (
        <Admonition
          showIcon={false}
          type={isPubliclyReadable ? 'warning' : 'default'}
          className="border-0 border-y rounded-none min-h-12 flex items-center"
        >
          <p>{admonitionMessage}</p>
        </Admonition>
      )}

      {(isPoliciesLoading || isLoadingRolesAccess) && (
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
