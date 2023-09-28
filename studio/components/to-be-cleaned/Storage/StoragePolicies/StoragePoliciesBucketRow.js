import Panel from 'components/ui/Panel'
import { isEmpty } from 'lodash'
import {
  Badge,
  Button,
  DropdownMenuContent_Shadcn_,
  DropdownMenuItem_Shadcn_,
  DropdownMenuSeparator_Shadcn_,
  DropdownMenuTrigger_Shadcn_,
  DropdownMenu_Shadcn_,
  IconArchive,
  IconEdit,
  IconMoreVertical,
  IconTrash,
} from 'ui'

const PolicyRow = ({
  policy,
  table,
  bucketName,
  onSelectPolicyEdit = () => {},
  onSelectPolicyDelete = () => {},
}) => {
  const { name, command } = policy
  return (
    <div className="group">
      <Panel.Content className="flex justify-between gap-2 border-b border-panel-border-light py-4 dark:border-panel-border-dark">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="font-mono text-xs text-foreground-lighter">{command}</div>
          <div className="flex flex-col gap-2 lg:flex-row">
            <span className="truncate text-sm text-foreground">{name}</span>
          </div>
        </div>
        <DropdownMenu_Shadcn_>
          <DropdownMenuTrigger_Shadcn_>
            <Button
              type="default"
              style={{ paddingLeft: 4, paddingRight: 4 }}
              icon={<IconMoreVertical />}
            />
          </DropdownMenuTrigger_Shadcn_>
          <DropdownMenuContent_Shadcn_ side="bottom" align="end" size="small">
            <DropdownMenuItem_Shadcn_
              className="space-x-2"
              type="outline"
              onClick={() => onSelectPolicyEdit(policy, bucketName, table)}
            >
              <IconEdit size={14} />
              <p>Edit</p>
            </DropdownMenuItem_Shadcn_>
            <DropdownMenuSeparator_Shadcn_ />
            <DropdownMenuItem_Shadcn_
              type="outline"
              className="space-x-2"
              onClick={() => onSelectPolicyDelete(policy)}
            >
              <IconTrash size={14} />
              <p>Delete</p>
            </DropdownMenuItem_Shadcn_>
          </DropdownMenuContent_Shadcn_>
        </DropdownMenu_Shadcn_>
      </Panel.Content>
    </div>
  )
}

const StoragePoliciesBucketRow = ({
  table = '',
  label = '',
  bucket = {},
  policies = [],
  onSelectPolicyAdd = () => {},
  onSelectPolicyEdit = () => {},
  onSelectPolicyDelete = () => {},
}) => {
  const getFooterLabel = () => {
    if (isEmpty(bucket))
      return table === 'objects'
        ? `${policies.length} polic${
            policies.length > 1 ? 'ies' : 'y'
          } that are not tied to any buckets`
        : `${policies.length} polic${policies.length > 1 ? 'ies' : 'y'} that target your buckets`
    return `${policies.length} polic${policies.length > 1 ? 'ies' : 'y'} in ${bucket.name}`
  }

  return (
    <Panel
      title={[
        <div key={label} className="flex w-full items-center justify-between">
          <div className="flex items-center space-x-4">
            <IconArchive className="text-foreground-light" size="small" />
            <h4 className="m-0 text-lg">
              <span>{label}</span>
            </h4>
            {bucket.public && <Badge color="yellow">Public</Badge>}
          </div>
          <Button type="outline" onClick={() => onSelectPolicyAdd(bucket.name, table)}>
            New policy
          </Button>
        </div>,
      ]}
    >
      {policies.length === 0 ? (
        <div className="p-4 px-6">
          <p className="text-sm text-foreground-lighter">No policies created yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 divide-y dark:divide-dark">
          {policies.map((policy) => (
            <PolicyRow
              key={policy.name}
              policy={policy}
              table={table}
              bucketName={bucket.name}
              onSelectPolicyEdit={onSelectPolicyEdit}
              onSelectPolicyDelete={onSelectPolicyDelete}
            />
          ))}
          {policies.length !== 0 ? (
            <div className="px-6 py-2">
              <p className="text-sm text-foreground-light">{getFooterLabel()}</p>
            </div>
          ) : null}
        </div>
      )}
    </Panel>
  )
}

export default StoragePoliciesBucketRow
