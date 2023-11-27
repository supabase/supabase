import type { PostgresPolicy, PostgresTable } from '@supabase/postgres-meta'
import { noop } from 'lodash'
import { observer } from 'mobx-react-lite'
import { Alert } from 'ui'

import Panel from 'components/ui/Panel'
import { useStore } from 'hooks'
import PolicyRow from './PolicyRow'
import PolicyTableRowHeader from './PolicyTableRowHeader'

interface PolicyTableRowProps {
  table: PostgresTable
  isLocked: boolean
  onSelectToggleRLS: (table: PostgresTable) => void
  onSelectCreatePolicy: (table: PostgresTable) => void
  onSelectEditPolicy: (policy: PostgresPolicy) => void
  onSelectDeletePolicy: (policy: PostgresPolicy) => void
}

const PolicyTableRow = ({
  table,
  isLocked,
  onSelectToggleRLS = noop,
  onSelectCreatePolicy = noop,
  onSelectEditPolicy = noop,
  onSelectDeletePolicy = noop,
}: PolicyTableRowProps) => {
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
          <p className="text-foreground-light text-sm">No policies created yet</p>
          {!isLocked &&
            (table.rls_enabled ? (
              <p className="text-foreground-light text-sm">
                RLS is enabled - create a policy to allow access to this table.
              </p>
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
            ))}
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
