import { FC } from 'react'
import { Button, Dropdown, IconEdit, IconTrash, IconMoreVertical } from '@supabase/ui'
import Panel from 'components/to-be-cleaned/Panel'
import { PostgresPolicy } from '@supabase/postgres-meta'

interface Props {
  policy: PostgresPolicy
  onSelectEditPolicy: (policy: PostgresPolicy) => void
  onSelectDeletePolicy: (policy: PostgresPolicy) => void
}

const PolicyRow: FC<Props> = ({
  policy,
  onSelectEditPolicy = () => {},
  onSelectDeletePolicy = () => {},
}) => {
  return (
    <Panel.Content
      className={[
        'border-panel-border-light dark:border-panel-border-dark flex',
        'w-full gap-4 border-b py-4 lg:items-center',
      ].join(' ')}
    >
      <div className="text-scale-900 font-mono text-xs">{policy.command}</div>
      <div className="flex grow flex-col gap-2 truncate lg:flex-row">
        <span className="text-scale-1200 max-w-xs truncate text-sm">{policy.name}</span>
        <span className="text-scale-1100 truncate text-sm">
          {policy.definition || policy.check}
        </span>
      </div>
      <div className="">
        <Dropdown
          side="bottom"
          align="end"
          size="small"
          overlay={
            <>
              <Dropdown.Item
                icon={<IconEdit size={14} />}
                onClick={() => onSelectEditPolicy(policy)}
              >
                Edit
              </Dropdown.Item>
              <Dropdown.Seperator />
              <Dropdown.Item
                icon={<IconTrash size={14} />}
                onClick={() => onSelectDeletePolicy(policy)}
              >
                Delete
              </Dropdown.Item>
            </>
          }
        >
          <Button
            type="default"
            style={{ paddingLeft: 4, paddingRight: 4 }}
            icon={<IconMoreVertical />}
          />
        </Dropdown>
      </div>
    </Panel.Content>
  )
}

export default PolicyRow
