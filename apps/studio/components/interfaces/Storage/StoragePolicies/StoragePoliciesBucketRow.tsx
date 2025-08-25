import Panel from 'components/ui/Panel'
import { isEmpty } from 'lodash'
import { Archive, Edit, MoreVertical, Trash } from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'ui'

interface PolicyRowProps {
  policy: any
  table: any
  bucketName: string
  onSelectPolicyEdit: (p: any, s: string, t: any) => void
  onSelectPolicyDelete: (s: string) => void
}

const PolicyRow = ({
  policy,
  table,
  bucketName,
  onSelectPolicyEdit = () => {},
  onSelectPolicyDelete = () => {},
}: PolicyRowProps) => {
  const { name, command } = policy
  return (
    <CardContent className="group flex justify-between gap-2 border-b border-overlay py-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="font-mono text-xs text-foreground-lighter">{command}</div>
        <div className="flex flex-col gap-2 lg:flex-row">
          <span className="truncate text-sm text-foreground">{name}</span>
        </div>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Button type="default" className="px-1.5" icon={<MoreVertical />} />
        </DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" align="end">
          <DropdownMenuItem
            className="gap-x-2"
            onClick={() => onSelectPolicyEdit(policy, bucketName, table)}
          >
            <Edit size={14} />
            <p>Edit</p>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="gap-x-2" onClick={() => onSelectPolicyDelete(policy)}>
            <Trash size={14} />
            <p>Delete</p>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </CardContent>
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
}: any) => {
  return (
    <Card>
      <CardHeader className="flex flex-row w-full items-center justify-between gap-0 space-y-0">
        <div className="flex items-center gap-3">
          <Archive className="text-foreground-light" size={16} strokeWidth={1.5} />
          <CardTitle>{label}</CardTitle>
          {bucket.public && <Badge variant="warning">Public</Badge>}
        </div>
        <Button type="outline" onClick={() => onSelectPolicyAdd(bucket.name, table)}>
          New policy
        </Button>
      </CardHeader>
      {policies.length === 0 ? (
        <CardContent>
          <p className="text-sm text-foreground-lighter">No policies created yet</p>
        </CardContent>
      ) : (
        <div>
          {policies.map((policy: any) => (
            <PolicyRow
              key={policy.name}
              policy={policy}
              table={table}
              bucketName={bucket.name}
              onSelectPolicyEdit={onSelectPolicyEdit}
              onSelectPolicyDelete={onSelectPolicyDelete}
            />
          ))}
        </div>
      )}
    </Card>
  )
}

export default StoragePoliciesBucketRow
