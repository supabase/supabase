import { FC } from 'react'

import PolicyTableRowHeader from './PolicyTableRowHeader'
import PolicyRow from './PolicyRow'
import Panel from 'components/to-be-cleaned/Panel'

interface Props {
  table: any
  onSelectToggleRLS: (table: any) => void
  onSelectCreatePolicy: () => void
  onSelectEditPolicy: (policy: any) => void
  onSelectDeletePolicy: (policy: any) => void
}

const PolicyTableRow: FC<Props> = ({
  table = {},
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

      {table.policies.map((policy: any) => (
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
