import { ResourceItem } from 'components/ui/Resource/ResourceItem'
import { Badge } from 'ui'

interface AWSPrivateLinkAccountItemProps {
  aws_account_id: string
  account_name?: string
  status: 'CREATING' | 'READY' | 'ASSOCIATION_REQUEST_EXPIRED' | 'ASSOCIATION_ACCEPTED' | 'CREATION_FAILED' | 'DELETING'
  shared_at: string | null
  onClick: () => void
  onDelete: () => void
}

const AWSPrivateLinkAccountItem = ({
  aws_account_id,
  account_name,
  status,
  onClick,
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
    <ResourceItem
      onClick={onClick}
      actions={[{ label: 'Delete account', onClick: onDelete }]}
      meta={getStatusBadge()}
    >
      <div>{aws_account_id}</div>
      <div className="text-sm text-foreground-lighter">{account_name || 'No description'}</div>
    </ResourceItem>
  )
}

export default AWSPrivateLinkAccountItem
