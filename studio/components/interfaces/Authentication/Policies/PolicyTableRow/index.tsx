import { FC } from 'react'
import { PostgresTable, PostgresPolicy } from '@supabase/postgres-meta'

import PolicyTableRowHeader from './PolicyTableRowHeader'
import PolicyRow from './PolicyRow'
import Panel from 'components/to-be-cleaned/Panel'

interface Props {
  table: PostgresTable
  onSelectToggleRLS: (table: PostgresTable) => void
  onSelectCreatePolicy: () => void
  onSelectEditPolicy: (policy: PostgresPolicy) => void
  onSelectDeletePolicy: (policy: PostgresPolicy) => void
}

const PolicyTableRow: FC<Props> = ({
  table,
  onSelectToggleRLS = () => {},
  onSelectCreatePolicy = () => {},
  onSelectEditPolicy = () => {},
  onSelectDeletePolicy = () => {},
}) => {
  return (
    <Panel
      title={
        <PolicyTableRowHeader
          table={table}
          onSelectToggleRLS={onSelectToggleRLS}
          onSelectCreatePolicy={onSelectCreatePolicy}
        />
      }
    >
      {table.policies.length === 0 && (
        <div className="p-4 px-6">
          <p className="text-scale-900 text-sm">No policies created yet</p>
        </div>
      )}

      {/* @ts-ignore */}
      {table.policies.map((policy) => (
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
