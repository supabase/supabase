import { ResourceItem } from 'components/ui/Resource/ResourceItem'
import { Badge } from 'ui'

interface AWSPrivateLinkAccountItemProps {
  id: string
  awsAccountId: string
  description: string
  status: string
  onClick: () => void
  onDelete: () => void
}

const AWSPrivateLinkAccountItem = ({
  id,
  awsAccountId,
  description,
  status,
  onClick,
  onDelete,
}: AWSPrivateLinkAccountItemProps) => {
  const isActive = status === 'connected'

  return (
    <ResourceItem
      onClick={onClick}
      actions={[{ label: 'Delete account', onClick: onDelete }]}
      meta={isActive ? <Badge variant="success">Connected</Badge> : <Badge>Pending</Badge>}
    >
      <div>{awsAccountId}</div>
      <div className="text-sm text-foreground-lighter">{description}</div>
    </ResourceItem>
  )
}

export default AWSPrivateLinkAccountItem
