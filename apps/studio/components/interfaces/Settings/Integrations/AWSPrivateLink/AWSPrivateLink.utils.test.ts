import { describe, expect, it } from 'vitest'

import {
  getConnectionsAttention,
  getConnectionsAttentionCopy,
  getConnectionStatusUi,
  getConnectionTitle,
  type PrivateLinkConnectionStatus,
} from './AWSPrivateLink.utils'

describe('getConnectionStatusUi', () => {
  it.each([
    ['ASSOCIATION_ACCEPTED', { badge: 'Connected', badgeVariant: 'success' }],
    ['READY', { badge: 'Waiting', badgeVariant: 'warning' }],
    ['CREATING', { badge: 'Creating', badgeVariant: 'default' }],
    ['DELETING', { badge: 'Deleting', badgeVariant: 'warning' }],
    ['ASSOCIATION_REQUEST_EXPIRED', { badge: 'Expired', badgeVariant: 'destructive' }],
    ['CREATION_FAILED', { badge: 'Failed', badgeVariant: 'destructive' }],
  ] as const satisfies ReadonlyArray<
    [PrivateLinkConnectionStatus, ReturnType<typeof getConnectionStatusUi>]
  >)('maps %s', (status, expected) => {
    expect(getConnectionStatusUi(status)).toEqual(expected)
  })

  it('returns unknown copy when status is missing', () => {
    expect(getConnectionStatusUi()).toEqual({ badge: 'Unknown', badgeVariant: 'default' })
  })
})

describe('getConnectionTitle', () => {
  it('uses the customer nickname when present', () => {
    expect(
      getConnectionTitle({
        account_name: 'Production VPC',
        aws_account_id: '123456789012',
      })
    ).toBe('Production VPC')
  })

  it('falls back to the AWS account ID for an unnamed connection', () => {
    expect(getConnectionTitle({ aws_account_id: '123456789012' })).toBe('123456789012')
  })

  it('falls back to the AWS account ID for a blank nickname', () => {
    expect(
      getConnectionTitle({
        account_name: '   ',
        aws_account_id: '123456789012',
      })
    ).toBe('123456789012')
  })
})

describe('getConnectionsAttentionCopy', () => {
  it('returns null when nothing needs attention', () => {
    expect(getConnectionsAttentionCopy({ waitingCount: 0, expiredCount: 0 })).toBeNull()
  })

  it('warns when a connection is waiting', () => {
    const copy = getConnectionsAttentionCopy({ waitingCount: 1, expiredCount: 0 })
    expect(copy?.type).toBe('warning')
    expect(copy?.title).toBe('Waiting for the AWS account owner')
    expect(copy?.showAcceptLink).toBe(true)
  })

  it('uses destructive copy when only expired', () => {
    const copy = getConnectionsAttentionCopy({ waitingCount: 0, expiredCount: 2 })
    expect(copy?.type).toBe('destructive')
    expect(copy?.title).toBe('Connection requests expired')
    expect(copy?.showAcceptLink).toBe(false)
  })

  it('counts statuses from a list', () => {
    expect(
      getConnectionsAttention([
        { status: 'READY' },
        { status: 'ASSOCIATION_ACCEPTED' },
        { status: 'ASSOCIATION_REQUEST_EXPIRED' },
      ])
    ).toEqual({ waitingCount: 1, expiredCount: 1 })
  })
})
