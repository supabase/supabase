import type { PostgresPolicy, PostgresTable } from '@supabase/postgres-meta'
import { noop } from 'lodash'
import { AlertDescription_Shadcn_, AlertTitle_Shadcn_, Alert_Shadcn_ } from 'ui'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { WarningIcon } from 'ui'
import Panel from 'components/ui/Panel'
import { useDatabasePoliciesQuery } from 'data/database-policies/database-policies-query'
import PolicyRow from './PolicyRow'
import PolicyTableRowHeader from './PolicyTableRowHeader'

interface PolicyTableRowProps {
  table: PostgresTable
  isLocked: boolean
  onSelectToggleRLS: (table: PostgresTable) => void
  onSelectCreatePolicy: () => void
  onSelectEditPolicy: (policy: PostgresPolicy) => void
  onSelectDeletePolicy: (policy: PostgresPolicy) => void
}

const PolicyTableRow = ({
  table,
  isLocked,
  onSelectToggleRLS = noop,
  onSelectCreatePolicy,
  onSelectEditPolicy = noop,
  onSelectDeletePolicy = noop,
}: PolicyTableRowProps) => {
  const { project } = useProjectContext()
  const { data } = useDatabasePoliciesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const policies = (data ?? [])
    .filter((policy) => policy.schema === table.schema && policy.table === table.name)
    .sort((a, b) => a.name.localeCompare(b.name))

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
      {(!table.rls_enabled || policies.length === 0) && (
        <div className="px-6 py-4 flex flex-col gap-y-3">
          {table.rls_enabled && policies.length === 0 && (
            <Alert_Shadcn_>
              <WarningIcon />
              <AlertTitle_Shadcn_>
                Row Level Security is enabled for this table, but no policies are set
              </AlertTitle_Shadcn_>
              <AlertDescription_Shadcn_>
                Select queries will return an{' '}
                <span className="text-foreground underline">empty array</span> of results.
              </AlertDescription_Shadcn_>
            </Alert_Shadcn_>
          )}
          {!table.rls_enabled && (
            <Alert_Shadcn_ variant="warning">
              <WarningIcon />
              <AlertTitle_Shadcn_>
                Warning: Row Level Security is disabled. Your table is publicly readable and
                writable.
              </AlertTitle_Shadcn_>
              <AlertDescription_Shadcn_>
                Anyone with the project's anonymous key can modify or delete your data. Enable RLS
                and create access policies to keep your data secure.
              </AlertDescription_Shadcn_>
            </Alert_Shadcn_>
          )}
          {policies.length === 0 && (
            <p className="text-foreground-light text-sm">No policies created yet</p>
          )}
        </div>
      )}

      {policies?.map((policy) => (
        <PolicyRow
          key={policy.id}
          policy={policy}
          onSelectEditPolicy={onSelectEditPolicy}
          onSelectDeletePolicy={onSelectDeletePolicy}
        />
      ))}
    </Panel>
  )
}

export default PolicyTableRow
