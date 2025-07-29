import { ResourceItem } from 'components/ui/Resource/ResourceItem'
import { BASE_PATH } from 'lib/constants'
import { Badge } from 'ui'

interface AWSPrivateLinkAccountItemProps {
  id: string
  awsAccountId: string
  region: string
  status: string
  onClick: () => void
  onDelete: () => void
}

const AWSPrivateLinkAccountItem = ({
  id,
  awsAccountId,
  region,
  status,
  onClick,
  onDelete,
}: AWSPrivateLinkAccountItemProps) => {
  const isActive = status === 'ACTIVE'

  return (
    <ResourceItem
      onClick={onClick}
      actions={[{ label: 'Delete account', onClick: onDelete }]}
      meta={isActive ? <Badge variant="success">Connected</Badge> : <Badge>Disconnected</Badge>}
    >
      <div>{awsAccountId}</div>
      <div className="text-sm text-foreground-lighter">{region}</div>
    </ResourceItem>
  )
}

export default AWSPrivateLinkAccountItem
