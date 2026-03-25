import { Edit, MoreVertical, Trash } from 'lucide-react'

import {
  Badge,
  Button,
  CardContent,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'ui'

interface AWSPrivateLinkAccountItemProps {
  aws_account_id: string
  account_name?: string
  status:
    | 'CREATING'
    | 'READY'
    | 'ASSOCIATION_REQUEST_EXPIRED'
    | 'ASSOCIATION_ACCEPTED'
    | 'CREATION_FAILED'
    | 'DELETING'
  shared_at: string | null
  onEdit: () => void
  onDelete: () => void
}

export const AWSPrivateLinkAccountItem = ({
  aws_account_id,
  account_name,
  status,
  onEdit,
  onDelete,
}: AWSPrivateLinkAccountItemProps) => {
  const getStatusBadge = () => {
    switch (status) {
      case 'ASSOCIATION_ACCEPTED':
        return <Badge variant="success">Connected</Badge>
      case 'READY':
        return <Badge variant="success">Ready</Badge>
      case 'CREATING':
        return <Badge variant="warning">Creating</Badge>
      case 'DELETING':
        return <Badge variant="destructive">Deleting</Badge>
      case 'ASSOCIATION_REQUEST_EXPIRED':
        return <Badge variant="destructive">Expired</Badge>
      case 'CREATION_FAILED':
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge>Unknown</Badge>
    }
  }

  return (
    <CardContent className="flex items-center justify-between text-sm gap-4">
      <div className="flex-1">
        <div>{aws_account_id}</div>
        <div className="text-sm text-foreground-lighter">{account_name || 'No description'}</div>
      </div>

      {getStatusBadge()}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="text" className="px-1" icon={<MoreVertical />} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem onClick={onEdit} className="gap-x-2">
            <Edit size={14} />
            <span>View account</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onDelete} className="gap-x-2">
            <Trash size={14} />
            <span>Delete account</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </CardContent>
  )
}
