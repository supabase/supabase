import { ChevronRight, EllipsisVertical, Shield } from 'lucide-react'
import { Button, Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'ui'

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
            <TableHead>Command</TableHead>
            <TableHead>Applied to</TableHead>
            <TableHead className="w-1">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow
            className="relative cursor-pointer inset-focus"
            onClick={(event) => handleBucketNavigation('avatars', event)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                handleBucketNavigation('avatars', event)
              }
            }}
            tabIndex={0}
          >
            <TableCell className="w-1">
              <Shield aria-label="bucket icon" size={16} className="text-foreground-muted" />
            </TableCell>
            <TableCell>Anyone can view all active listings</TableCell>
            <TableCell>
              <code className="text-foreground-muted text-code-inline uppercase">select</code>
            </TableCell>
            <TableCell className="text-foreground-lighter">public</TableCell>
            <TableCell className="flex justify-end items-center h-full gap-3">
              <Button
                icon={<EllipsisVertical />}
                aria-label={`More actions`}
                type="default"
                size="tiny"
                className="w-7"
              />
              <div>
                <ChevronRight aria-hidden={true} size={14} className="text-foreground-muted/60" />
              </div>
              <button tabIndex={-1} className="sr-only">
                Go to policy
              </button>
            </TableCell>
          </TableRow>
          <TableRow
            className="relative cursor-pointer inset-focus"
            onClick={(event) => handleBucketNavigation('avatars', event)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                handleBucketNavigation('avatars', event)
              }
            }}
            tabIndex={0}
          >
            <TableCell className="w-1">
              <Shield aria-label="bucket icon" size={16} className="text-foreground-muted" />
            </TableCell>
            <TableCell>Users can delete their own listings</TableCell>
            <TableCell>
              <code className="text-foreground-muted text-code-inline uppercase">delete</code>
            </TableCell>
            <TableCell className="text-foreground-lighter">authenticated</TableCell>
            <TableCell className="flex justify-end items-center h-full gap-3">
              <Button
                icon={<EllipsisVertical />}
                aria-label={`More actions`}
                type="default"
                size="tiny"
                className="w-7"
              />
              <div>
                <ChevronRight aria-hidden={true} size={14} className="text-foreground-muted/60" />
              </div>
              <button tabIndex={-1} className="sr-only">
                Go to policy
              </button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Card>
  )
}
