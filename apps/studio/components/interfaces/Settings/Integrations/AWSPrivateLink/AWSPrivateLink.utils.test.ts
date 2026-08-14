import { describe, expect, it } from 'vitest'

import {
  getConnectionsAttentionCopy,
  getConnectionStatusUi,
  type PrivateLinkConnectionStatus,
} from './AWSPrivateLink.utils'

describe('getConnectionStatusUi', () => {
  it.each([
    [
      'ASSOCIATION_ACCEPTED',
      {
        badge: 'Connected',
        badgeVariant: 'success',
        title: 'This connection is active',
      },
    ],
    [
      'READY',
      {
        badge: 'Waiting',
        badgeVariant: 'warning',
        title: 'Waiting for the AWS account owner to accept',
        description: 'This request expires after 12 hours.',
      },
    ],
    [
      'CREATING',
      {
        badge: 'Creating',
        badgeVariant: 'default',
        title: 'This connection is being created',
      },
    ],
    [
      'DELETING',
      {
        badge: 'Deleting',
        badgeVariant: 'warning',
        title: 'This connection is being deleted',
      },
    ],
    [
      'ASSOCIATION_REQUEST_EXPIRED',
      {
        badge: 'Expired',
        badgeVariant: 'destructive',
        title: 'This request has expired',
      },
    ],
    [
      'CREATION_FAILED',
      {
        badge: 'Failed',
        badgeVariant: 'destructive',
        title: "Couldn't create this connection",
      },
    ],
  ] as const satisfies ReadonlyArray<
    [PrivateLinkConnectionStatus, Partial<ReturnType<typeof getConnectionStatusUi>>]
  >)('maps %s', (status, expected) => {
    expect(getConnectionStatusUi(status)).toMatchObject(expected)
  })

  it('returns unknown copy when status is missing', () => {
    const ui = getConnectionStatusUi()

    expect(ui.badge).toBe('Unknown')
    expect(ui.badgeVariant).toBe('default')
    expect(ui.title).toBe("Couldn't determine this connection's status")
  })
})

describe('getConnectionsAttentionCopy', () => {
  it('returns null when nothing needs attention', () => {
    expect(getConnectionsAttentionCopy({ waitingCount: 0, expiredCount: 0 })).toBeNull()
  })

  it('returns waiting copy for a single ready connection', () => {
    const copy = getConnectionsAttentionCopy({ waitingCount: 1, expiredCount: 0 })

    expect(copy?.type).toBe('warning')
    expect(copy?.title).toBe('Waiting for the AWS account owner')
    expect(copy?.showAcceptLink).toBe(true)
  })

  it('returns expired copy when only expired connections remain', () => {
    const copy = getConnectionsAttentionCopy({ waitingCount: 0, expiredCount: 2 })

    expect(copy?.type).toBe('destructive')
    expect(copy?.title).toBe('Connection requests expired')
    expect(copy?.showAcceptLink).toBe(false)
  })
})
