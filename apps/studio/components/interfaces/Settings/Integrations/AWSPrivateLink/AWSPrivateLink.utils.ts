import type { AWSAccount } from '@/data/aws-accounts/aws-accounts-query'

export type PrivateLinkConnectionStatus = AWSAccount['status']

type BadgeVariant = 'success' | 'warning' | 'destructive' | 'default'

export type ConnectionStatusUi = {
  badge: string
  badgeVariant: BadgeVariant
}

const CONNECTION_STATUS_UI: Record<PrivateLinkConnectionStatus, ConnectionStatusUi> = {
  ASSOCIATION_ACCEPTED: {
    badge: 'Connected',
    badgeVariant: 'success',
  },
  READY: {
    badge: 'Waiting',
    badgeVariant: 'warning',
  },
  CREATING: {
    badge: 'Creating',
    badgeVariant: 'default',
  },
  DELETING: {
    badge: 'Deleting',
    badgeVariant: 'warning',
  },
  ASSOCIATION_REQUEST_EXPIRED: {
    badge: 'Expired',
    badgeVariant: 'destructive',
  },
  CREATION_FAILED: {
    badge: 'Failed',
    badgeVariant: 'destructive',
  },
}

const UNKNOWN_STATUS_UI: ConnectionStatusUi = {
  badge: 'Unknown',
  badgeVariant: 'default',
}

export function getConnectionStatusUi(status?: PrivateLinkConnectionStatus): ConnectionStatusUi {
  if (!status) return UNKNOWN_STATUS_UI
  return CONNECTION_STATUS_UI[status] ?? UNKNOWN_STATUS_UI
}

export function getConnectionTitle(
  account: Pick<AWSAccount, 'account_name' | 'aws_account_id'>
): string {
  const nickname = account.account_name?.trim()
  if (nickname) return nickname
  return account.aws_account_id
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
  shouldShowAcceptLink: boolean
} | null {
  const { waitingCount, expiredCount } = attention
  if (waitingCount === 0 && expiredCount === 0) return null

  if (expiredCount > 0 && waitingCount === 0) {
    return {
      type: 'destructive',
      title: expiredCount === 1 ? 'A connection request expired' : 'Connection requests expired',
      description: `AWS can no longer accept the expired share${expiredCount === 1 ? '' : 's'} below.`,
      shouldShowAcceptLink: false,
    }
  }

  if (waitingCount > 0 && expiredCount > 0) {
    return {
      type: 'warning',
      title: 'Some connections need attention',
      description: `Accept the waiting resource share${waitingCount === 1 ? '' : 's'} in AWS within 12 hours.`,
      shouldShowAcceptLink: true,
    }
  }

  return {
    type: 'warning',
    title:
      waitingCount === 1 ? 'Waiting for the AWS account owner' : 'Waiting for AWS account owners',
    description: `Accept the resource share${waitingCount === 1 ? '' : 's'} in AWS within 12 hours.`,
    shouldShowAcceptLink: true,
  }
}
