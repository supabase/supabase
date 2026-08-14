import type { AWSAccount } from '@/data/aws-accounts/aws-accounts-query'

export type PrivateLinkConnectionStatus = AWSAccount['status']

type BadgeVariant = 'success' | 'warning' | 'destructive' | 'default'

export type ConnectionStatusUi = {
  title: string
  description: string
  badge: string
  badgeVariant: BadgeVariant
}

const CONNECTION_STATUS_UI: Record<PrivateLinkConnectionStatus, ConnectionStatusUi> = {
  ASSOCIATION_ACCEPTED: {
    title: 'This connection is active',
    description: 'The AWS account owner has accepted the resource share.',
    badge: 'Connected',
    badgeVariant: 'success',
  },
  READY: {
    title: 'Waiting for the AWS account owner to accept',
    description: 'This request expires after 12 hours.',
    badge: 'Waiting',
    badgeVariant: 'warning',
  },
  CREATING: {
    title: 'This connection is being created',
    description: '',
    badge: 'Creating',
    badgeVariant: 'default',
  },
  DELETING: {
    title: 'This connection is being deleted',
    description: '',
    badge: 'Deleting',
    badgeVariant: 'warning',
  },
  ASSOCIATION_REQUEST_EXPIRED: {
    title: 'This request has expired',
    description: 'Add a new connection to try again.',
    badge: 'Expired',
    badgeVariant: 'destructive',
  },
  CREATION_FAILED: {
    title: "Couldn't create this connection",
    description: 'Add a new connection to try again.',
    badge: 'Failed',
    badgeVariant: 'destructive',
  },
}

const UNKNOWN_STATUS_UI: ConnectionStatusUi = {
  title: "Couldn't determine this connection's status",
  description: '',
  badge: 'Unknown',
  badgeVariant: 'default',
}

export function getConnectionStatusUi(status?: PrivateLinkConnectionStatus): ConnectionStatusUi {
  if (!status) return UNKNOWN_STATUS_UI
  return CONNECTION_STATUS_UI[status] ?? UNKNOWN_STATUS_UI
}

export type ConnectionsAttention = {
  waitingCount: number
  expiredCount: number
}

export function getConnectionsAttention(
  accounts: Array<Pick<AWSAccount, 'status'>> | undefined
): ConnectionsAttention {
  const waitingCount = accounts?.filter((account) => account.status === 'READY').length ?? 0
  const expiredCount =
    accounts?.filter((account) => account.status === 'ASSOCIATION_REQUEST_EXPIRED').length ?? 0

  return { waitingCount, expiredCount }
}

export function getConnectionsAttentionCopy(attention: ConnectionsAttention): {
  type: 'warning' | 'destructive'
  title: string
  description: string
  showAcceptLink: boolean
} | null {
  const { waitingCount, expiredCount } = attention
  if (waitingCount === 0 && expiredCount === 0) return null

  if (expiredCount > 0 && waitingCount === 0) {
    return {
      type: 'destructive',
      title: expiredCount === 1 ? 'A connection request expired' : 'Connection requests expired',
      description: 'Add a new connection to try again. AWS can no longer accept this share.',
      showAcceptLink: false,
    }
  }

  if (waitingCount > 0 && expiredCount > 0) {
    return {
      type: 'warning',
      title: 'Some connections need attention',
      description:
        'Accept waiting resource shares in AWS within 12 hours. Expired requests need a new connection.',
      showAcceptLink: true,
    }
  }

  return {
    type: 'warning',
    title:
      waitingCount === 1 ? 'Waiting for the AWS account owner' : 'Waiting for AWS account owners',
    description: 'Accept the resource share in AWS within 12 hours.',
    showAcceptLink: true,
  }
}
