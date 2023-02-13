import { FC } from 'react'
import type { PostgresTable, PostgresPolicy } from '@supabase/postgres-meta'
import { observer } from 'mobx-react-lite'
import { useStore } from 'hooks'

import PolicyTableRowHeader from './PolicyTableRowHeader'
import PolicyRow from './PolicyRow'
import Panel from 'components/ui/Panel'
import { Alert } from 'ui'

interface Props {
  table: PostgresTable
  isLocked: boolean
  onSelectToggleRLS: (table: PostgresTable) => void
  onSelectCreatePolicy: (table: PostgresTable) => void
  onSelectEditPolicy: (policy: PostgresPolicy) => void
  onSelectDeletePolicy: (policy: PostgresPolicy) => void
}

const PolicyTableRow: FC<Props> = ({
  table,
  isLocked,
  onSelectToggleRLS = () => {},
  onSelectCreatePolicy = () => {},
  onSelectEditPolicy = () => {},
  onSelectDeletePolicy = () => {},
}) => {
  const { meta } = useStore()
  const policies = meta.policies.list((x: PostgresPolicy) => x.table === table.name)

  return (
    <Panel
      title={
        <PolicyTableRowHeader
          table={table}
          isLocked={isLocked}
          onSelectToggleRLS={onSelectToggleRLS}
          onSelectCreatePolicy={onSelectCreatePolicy}
        />
      }
    >
      {policies.length === 0 && (
        <div className="p-4 px-6 space-y-1">
          <p className="text-scale-1100 text-sm">No policies created yet</p>
          {table.rls_enabled ? (
            <p className="text-scale-1000 text-sm">
              RLS is enabled - create a policy to allow access to this table.
            </p>
          ) : (
            <Alert
              withIcon
              variant="warning"
              className="!px-4 !py-3 !mt-3"
              title="Warning: RLS is disabled"
            >
              Anonymous access is allowed to this table
            </Alert>
          )}
        </div>
      )}

      {/* @ts-ignore */}
      {policies.map((policy) => (
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

export default observer(PolicyTableRow)
