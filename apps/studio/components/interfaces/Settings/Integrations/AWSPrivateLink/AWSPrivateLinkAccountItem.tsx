import { Badge } from 'ui'

import { getConnectionStatusUi, getConnectionTitle } from './AWSPrivateLink.utils'
import { ResourceItem } from '@/components/ui/Resource/ResourceItem'
import type { AWSAccount } from '@/data/aws-accounts/aws-accounts-query'
import { formatDatabaseID } from '@/data/read-replicas/replicas.utils'

export const AWSPrivateLinkAccountItem = ({
  account,
  onView,
}: {
  account: AWSAccount
  onView: () => void
}) => {
  const { account_name, aws_account_id, database_identifier, database_type, status } = account
  const title = getConnectionTitle({ account_name, aws_account_id })
  const statusUi = getConnectionStatusUi(status)
  const replicaId = database_identifier ? formatDatabaseID(database_identifier) : undefined
  const showDatabase = database_type === 'READ_REPLICA' || title === aws_account_id
  const databaseLabel =
    database_type === 'READ_REPLICA'
      ? `Read replica${replicaId ? ` (ID: ${replicaId})` : ''}`
      : 'Primary database'

  return (
    <ResourceItem
      onClick={onView}
      className="border-b! last:border-b-0!"
      meta={<Badge variant={statusUi.badgeVariant}>{statusUi.badge}</Badge>}
    >
      <div className="min-w-0">
        <div className="font-medium text-foreground truncate">{title}</div>
        {showDatabase && <p className="text-xs text-foreground-lighter">{databaseLabel}</p>}
      </div>
    </ResourceItem>
  )
}
