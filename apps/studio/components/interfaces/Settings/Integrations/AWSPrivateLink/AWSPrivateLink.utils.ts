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
    badge: 'Ready',
    badgeVariant: 'success',
  },
  CREATING: {
    title: 'This connection is being created',
    description: '',
    badge: 'Creating',
    badgeVariant: 'warning',
  },
  DELETING: {
    title: 'This connection is being deleted',
    description: '',
    badge: 'Deleting',
    badgeVariant: 'destructive',
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
