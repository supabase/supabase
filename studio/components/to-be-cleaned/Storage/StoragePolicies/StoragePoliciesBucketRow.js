import {
  Badge,
  Button,
  IconArchive,
  Dropdown,
  IconEdit,
  IconTrash,
  IconMoreVertical,
} from '@supabase/ui'
import { isEmpty } from 'lodash'
import Panel from 'components/ui/Panel'

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
      <Panel.Content className="flex gap-2 justify-between py-4 border-b border-panel-border-light dark:border-panel-border-dark">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="font-mono text-xs text-scale-900">{command}</div>
          <div className="flex flex-col lg:flex-row gap-2">
            <span className="text-sm text-scale-1200 truncate">{name}</span>
          </div>
        </div>
        <Dropdown
          side="bottom"
          align="end"
          size="small"
          overlay={
            <>
              <Dropdown.Item
                icon={<IconEdit size={14} />}
                type="outline"
                className="mx-2"
                onClick={() => onSelectPolicyEdit(policy, bucketName, table)}
              >
                Edit
              </Dropdown.Item>
              <Dropdown.Seperator />
              <Dropdown.Item
                icon={<IconTrash size={14} />}
                type="outline"
                onClick={() => onSelectPolicyDelete(policy)}
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
        <div key={label} className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-4">
            <IconArchive className="text-scale-1000" size="small" />
            <h4 className="text-lg m-0">
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
          <p className="text-sm text-scale-900">No policies created yet</p>
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
              <p className="text-scale-1100 text-sm">{getFooterLabel()}</p>
            </div>
          ) : null}
        </div>
      )}
    </Panel>
  )
}

export default StoragePoliciesBucketRow
