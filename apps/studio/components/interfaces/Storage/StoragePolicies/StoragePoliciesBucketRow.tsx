import { PostgresPolicy } from '@supabase/postgres-meta'
import { noop } from 'lodash'

import { Bucket } from 'data/storage/buckets-query'
import { PolicyRow } from 'components/interfaces/Auth/Policies/PolicyTableRow/PolicyRow'

import { Bucket as BucketIcon } from 'icons'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui'

interface StoragePoliciesBucketRowProps {
  table: string
  label: string
  bucket?: Bucket
  policies: PostgresPolicy[]
  onSelectPolicyAdd: (bucketName: string | undefined, table: string) => void
  onSelectPolicyEdit: (policy: PostgresPolicy, bucketName: string, table: string) => void
  onSelectPolicyDelete: (policy: PostgresPolicy) => void
}

export const StoragePoliciesBucketRow = ({
  table = '',
  label = '',
  bucket,
  policies = [],
  onSelectPolicyAdd = noop,
  onSelectPolicyEdit = noop,
  onSelectPolicyDelete = noop,
}: StoragePoliciesBucketRowProps) => {
  return (
    <Card>
      <CardHeader className="flex flex-row w-full items-center justify-between gap-0 space-y-0">
        <div className="flex items-center gap-3">
          <BucketIcon className="text-foreground-muted" size={16} strokeWidth={1.5} />
          <CardTitle>{label}</CardTitle>
          {bucket?.public && <Badge variant="warning">Public</Badge>}
        </div>
        <Button type="outline" onClick={() => onSelectPolicyAdd(bucket?.name, table)}>
          New policy
        </Button>
      </CardHeader>
      {policies.length === 0 ? (
        <CardContent>
          <p className="text-sm text-foreground-lighter">No policies created yet</p>
        </CardContent>
      ) : (
        <CardContent className="p-0">
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">Name</TableHead>
                <TableHead className="w-[20%]">Command</TableHead>
                <TableHead className="w-[30%]">Applied to</TableHead>
                <TableHead className="w-0 text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {policies.map((policy) => (
                <PolicyRow
                  key={policy.id ?? policy.name}
                  policy={policy}
                  onSelectEditPolicy={(p) => onSelectPolicyEdit(p, bucket?.name ?? '', table)}
                  onSelectDeletePolicy={onSelectPolicyDelete}
                />
              ))}
            </TableBody>
          </Table>
        </CardContent>
      )}
    </Card>
  )
}
