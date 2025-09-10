import type { PostgresPolicy } from '@supabase/postgres-meta'
import { noop } from 'lodash'

import AlertError from 'components/ui/AlertError'
import { useProjectPostgrestConfigQuery } from 'data/config/project-postgrest-config-query'
import { useDatabasePoliciesQuery } from 'data/database-policies/database-policies-query'
import { useTableRolesAccessQuery } from 'data/tables/table-roles-access-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import {
  Alert_Shadcn_,
  AlertDescription_Shadcn_,
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
import ShimmeringLoader from 'ui-patterns/ShimmeringLoader'
import { PolicyRow } from './PolicyRow'
import { PolicyTableRowHeader } from './PolicyTableRowHeader'

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
  const { data: project } = useSelectedProjectQuery()

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
  const isRealtimeSchema = table.schema === 'realtime'
  const isRealtimeMessagesTable = isRealtimeSchema && table.name === 'messages'
  const isTableLocked = isRealtimeSchema ? !isRealtimeMessagesTable : isLocked

  return (
    <Card className={cn(isPubliclyReadableWritable && 'border-warning-500')}>
      <CardHeader
        className={cn(
          'py-3 px-4',
          (isPubliclyReadableWritable || rlsEnabledNoPolicies) && 'border-b-0'
        )}
      >
        <PolicyTableRowHeader
          table={table}
          isLocked={isLocked}
          onSelectToggleRLS={onSelectToggleRLS}
          onSelectCreatePolicy={onSelectCreatePolicy}
        />
      </CardHeader>

      {(isPubliclyReadableWritable || rlsEnabledNoPolicies) && (
        <Alert_Shadcn_
          className="border-0 rounded-none mb-0 border-b border-t"
          variant={isPubliclyReadableWritable ? 'warning' : 'default'}
        >
          <AlertDescription_Shadcn_>
            {isPubliclyReadableWritable
              ? "Anyone with your project's anonymous key can read, modify, or delete your data."
              : 'No data will be selectable via Supabase APIs because RLS is enabled but no policies have been created yet.'}
          </AlertDescription_Shadcn_>
        </Alert_Shadcn_>
      )}

      {isLoading && (
        <CardContent>
          <ShimmeringLoader />
        </CardContent>
      )}

      {isError && (
        <CardContent>
          <AlertError
            className="border-0 rounded-none"
            error={error}
            subject="Failed to retrieve policies"
          />
        </CardContent>
      )}

      {isSuccess && (
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
