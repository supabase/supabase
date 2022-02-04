import { Badge, Button, Typography } from '@supabase/ui'
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
    <div className="flex has-hidden-children">
      <Panel.Content className="flex justify-between w-full py-4 border-b dark:border-dark">
        <div className="flex-1">
          <Typography.Text>{policy.name}</Typography.Text>
          <Typography.Text type="secondary" className="font-mono block" small>
            {policy.definition || policy.check}
          </Typography.Text>
        </div>
        <div className="relative w-64">
          <div className="top-0 right-0 absolute inline-block visible-child my-2">
            <Typography.Text type="secondary" className='font-mono text-right' small>
              {policy.command}
            </Typography.Text>
          </div>
          <div className="top-0 right-0 absolute inline-block -mr-3 hidden-child">
            <Button type="outline" className="mx-2" onClick={() => onSelectEditPolicy(policy)}>
              Edit
            </Button>
            <Button type="outline" onClick={() => onSelectDeletePolicy(policy)}>
              Delete
            </Button>
          </div>
        </div>
      </Panel.Content>
    </div>
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
          <Typography.Text type="secondary" className="opacity-50">
            No policies created yet
          </Typography.Text>
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
