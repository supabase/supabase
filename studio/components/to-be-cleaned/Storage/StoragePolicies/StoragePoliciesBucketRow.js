import { Badge, Button, IconArchive, Typography } from '@supabase/ui'
import { isEmpty } from 'lodash'
import Panel from 'components/to-be-cleaned/Panel'

const PolicyRow = ({
  policy,
  table,
  bucketName,
  onSelectPolicyEdit = () => {},
  onSelectPolicyDelete = () => {},
}) => {
  const { name, command } = policy
  return (
    <div className="grid grid-cols-10 p-4 px-6 group">
      <div className="col-span-4">
        <Typography.Text>{name}</Typography.Text>
      </div>
      <div className="col-span-4 flex flex-col">
        <div>
          <Badge color="green">{command}</Badge>
        </div>
      </div>
      <div className="col-span-2 flex items-center justify-end opacity-0 transition group-hover:opacity-100">
        <div name="flex">
          <Button
            type="outline"
            className="mr-2"
            onClick={() => onSelectPolicyEdit(policy, bucketName, table)}
          >
            Edit
          </Button>
          <Button type="outline" onClick={() => onSelectPolicyDelete(policy)}>
            Delete
          </Button>
        </div>
      </div>
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
            <Typography.Text type="secondary">
              <IconArchive size="small" />
            </Typography.Text>
            <Typography.Title level={4} className="m-0">
              <span>{label}</span>
            </Typography.Title>
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
          <Typography.Text type="secondary" className="opacity-50">
            No policies created yet
          </Typography.Text>
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
              <Typography.Text type="secondary" className="opacity-50">
                {getFooterLabel()}
              </Typography.Text>
            </div>
          ) : null}
        </div>
      )}
    </Panel>
  )
}

export default StoragePoliciesBucketRow
