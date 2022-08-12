import { FC } from 'react'
import { Button, Dropdown, IconEdit, IconTrash, IconMoreVertical } from '@supabase/ui'
import Panel from 'components/ui/Panel'
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
        'w-full space-x-4 border-b py-4 lg:items-center',
      ].join(' ')}
    >
      <div className="flex grow flex-col truncate space-y-1">
        <div className="flex items-center space-x-4">
          <p className="text-scale-1000 font-mono text-xs">{policy.command}</p>
          <p className="text-scale-1200 max-w-xs truncate text-sm">{policy.name}</p>
        </div>
        <div className="flex items-center space-x-2">
          <p className="text-scale-1000 text-sm">Applied to:</p>
          {policy.roles.map((role) => (
            <code className="text-scale-1000 text-xs">{role}</code>
          ))}
        </div>
      </div>
      <div>
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
