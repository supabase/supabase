import { FC } from 'react'
import { PostgresTable, PostgresPolicy } from '@supabase/postgres-meta'
import { observer } from 'mobx-react-lite'
import { useStore } from 'hooks'

import PolicyTableRowHeader from './PolicyTableRowHeader'
import PolicyRow from './PolicyRow'
import Panel from 'components/ui/Panel'

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
            <p className="text-amber-900 text-sm opacity-50">
              Warning: RLS is disabled - anonymous access is allowed to this table
            </p>
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
