import { FC } from 'react'
import { PostgresTable, PostgresPolicy } from '@supabase/postgres-meta'
import { observer } from 'mobx-react-lite'
import { useStore } from 'hooks'

import PolicyTableRowHeader from './PolicyTableRowHeader'
import PolicyRow from './PolicyRow'
import Panel from 'components/ui/Panel'

interface Props {
  table: PostgresTable
  onSelectToggleRLS: (table: PostgresTable) => void
  onSelectCreatePolicy: (table: PostgresTable) => void
  onSelectEditPolicy: (policy: PostgresPolicy) => void
  onSelectDeletePolicy: (policy: PostgresPolicy) => void
}

const PolicyTableRow: FC<Props> = observer(
  ({
    table,
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
            onSelectToggleRLS={onSelectToggleRLS}
            onSelectCreatePolicy={onSelectCreatePolicy}
          />
        }
      >
        {policies.length === 0 && (
          <div className="p-4 px-6">
            <p className="text-scale-900 text-sm">No policies created yet</p>
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
)

export default PolicyTableRow
