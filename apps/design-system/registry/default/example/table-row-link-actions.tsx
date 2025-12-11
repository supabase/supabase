import { ChevronRight, EllipsisVertical, Shield } from 'lucide-react'
import { Button, Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'ui'

const policies = [
  {
    id: 'policy-1',
    name: 'Anyone can view all active listings',
    command: 'select',
    appliedTo: 'public',
  },
  {
    id: 'policy-2',
    name: 'Users can delete their own listings',
    command: 'delete',
    appliedTo: 'authenticated',
  },
  {
    id: 'policy-3',
    name: 'Admins can update any listing',
    command: 'update',
    appliedTo: 'authenticated',
  },
]

const handlePolicyNavigation = (
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

export default function TableRowLinkActions() {
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
          {policies.map((policy) => (
            <TableRow
              key={policy.id}
              className="relative cursor-pointer inset-focus"
              onClick={(event) => {
                if (event.currentTarget !== event.target) return
                handlePolicyNavigation(policy.id, event)
              }}
              onKeyDown={(event) => {
                if (event.currentTarget !== event.target) return
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  handlePolicyNavigation(policy.id, event)
                }
              }}
              tabIndex={0}
            >
              <TableCell className="w-1">
                <Shield aria-label="policy icon" size={16} className="text-foreground-muted" />
              </TableCell>
              <TableCell>{policy.name}</TableCell>
              <TableCell>
                <code className="text-foreground-muted text-code-inline uppercase">
                  {policy.command}
                </code>
              </TableCell>
              <TableCell className="text-foreground-lighter">{policy.appliedTo}</TableCell>
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
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}
