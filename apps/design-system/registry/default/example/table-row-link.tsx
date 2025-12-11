import { FilesBucket as FilesBucketIcon } from 'icons'
import { ChevronRight } from 'lucide-react'
import { Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'ui'

const buckets = [
  {
    id: 'avatars',
    name: 'avatars',
    updated: '2 hours ago',
  },
  {
    id: 'listing-photos',
    name: 'listing-photos',
    updated: '1 day ago',
  },
  {
    id: 'documents',
    name: 'documents',
    updated: '3 days ago',
  },
]

const handleBucketNavigation = (
  bucketId: string,
  event: React.MouseEvent | React.KeyboardEvent
) => {
  const url = `/${bucketId}`
  if (event.metaKey || event.ctrlKey) {
    // window.open(`${url}`, '_blank') Disabled for demo purposes
  } else {
    // router.push(url) Disabled for demo purposes
  }
}

export default function TableRowLink() {
  return (
    <Card className="w-full">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-1">
              <span className="sr-only">Icon</span>
            </TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Updated</TableHead>
            <TableHead className="w-1">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {buckets.map((bucket) => (
            <TableRow
              key={bucket.id}
              className="relative cursor-pointer inset-focus"
              onClick={(event) => {
                if (event.currentTarget !== event.target) return
                handleBucketNavigation(bucket.id, event)
              }}
              onKeyDown={(event) => {
                if (event.currentTarget !== event.target) return
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  handleBucketNavigation(bucket.id, event)
                }
              }}
              tabIndex={0}
            >
              <TableCell className="w-1">
                <FilesBucketIcon
                  aria-label="bucket icon"
                  size={16}
                  className="text-foreground-muted"
                />
              </TableCell>
              <TableCell>{bucket.name}</TableCell>
              <TableCell className="text-foreground-muted">{bucket.updated}</TableCell>
              <TableCell>
                <div className="flex justify-end items-center h-full">
                  <ChevronRight aria-hidden={true} size={14} className="text-foreground-muted/60" />
                </div>
                <button tabIndex={-1} className="sr-only">
                  Go to bucket
                </button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}
