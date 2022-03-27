import {
  Badge,
  Button,
  Dropdown,
  IconEdit,
  IconMoreVertical,
  IconTrash,
  Typography,
} from '@supabase/ui'
import Panel from '../Panel'

const PolicyTableRowHeader = ({
  table = {},
  onSelectToggleRLS = () => {},
  onSelectCreatePolicy = () => {},
}) => {
  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex space-x-4 text-left">
        <Typography.Title level={4} className="m-0">
          <span>{table.name}</span>
        </Typography.Title>
        <Badge color={table.rls_enabled ? 'green' : 'yellow'}>
          {table.rls_enabled ? 'RLS enabled' : 'RLS disabled'}
        </Badge>
      </div>
      <div className="flex-1">
        <div className="flex flex-row-reverse">
          <Button type="outline" className="ml-2" onClick={() => onSelectCreatePolicy(table)}>
            New Policy
          </Button>
          <Button type="default" onClick={() => onSelectToggleRLS(table)}>
            {table.rls_enabled ? 'Disable RLS' : 'Enable RLS'}
          </Button>
        </div>
      </div>
    </div>
  )
}

const PolicyRow = ({
  policy = {},
  onSelectEditPolicy = () => {},
  onSelectDeletePolicy = () => {},
}) => {
  return (
    <Panel.Content
      className="
        w-full 
        flex gap-2 
        lg:items-center
        py-4 
        border-b 
        border-panel-border-light 
        dark:border-panel-border-dark
      "
    >
      <div className="font-mono text-xs text-scale-900">{policy.command}</div>
      <div className="flex flex-col lg:flex-row gap-2 truncate grow">
        <span className="text-sm text-scale-1200 truncate max-w-xs">{policy.name}</span>
        <span className="text-sm text-scale-1100 truncate">
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
                type="outline"
                onClick={() => onSelectEditPolicy(policy)}
              >
                Edit
              </Dropdown.Item>
              <Dropdown.Seperator />
              <Dropdown.Item
                icon={<IconTrash size={14} />}
                type="outline"
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

const PolicyTableRow = ({
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
          <p className="text-sm text-scale-900">No policies created yet</p>
        </div>
      )}

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
