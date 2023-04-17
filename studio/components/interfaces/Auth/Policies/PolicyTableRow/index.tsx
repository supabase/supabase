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
  const policies = meta.policies.list(
    (policy: PostgresPolicy) => policy.schema === table.schema && policy.table === table.name
  )

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
            <Alert
              withIcon
              variant="info"
              className="!px-4 !py-3 !mt-3"
              title="RLS is on. However, policies are required to query data."
            >
              <p>
                You need to write an access policy before you can query data from this table.
                Without a policy, querying this table will result in an <u>empty array</u> of
                results.
              </p>
            </Alert>
          ) : (
            <Alert
              withIcon
              variant="warning"
              className="!px-4 !py-3 !mt-3"
              title="Warning: RLS is disabled. Your table is publicly readable and writable."
            >
              Anyone with the anon. key can modify or delete your data. You should turn on RLS and
              create access policies to keep your data secure.
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
