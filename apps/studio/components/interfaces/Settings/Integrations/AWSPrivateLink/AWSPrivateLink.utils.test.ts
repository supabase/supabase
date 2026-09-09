import { describe, expect, it } from 'vitest'

import {
  getConnectionsAttention,
  getConnectionsAttentionCopy,
  getConnectionStatusUi,
  getConnectionTitle,
  isIamRoleArn,
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
        partner: 'vercel',
      })
    ).toBe('Production VPC')
  })

  it('falls back to Vercel when that partner has no nickname', () => {
    expect(getConnectionTitle({ aws_account_id: '111122223333', partner: 'vercel' })).toBe('Vercel')
  })

  it('falls back to the AWS account ID for an unnamed AWS-direct connection', () => {
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

describe('isIamRoleArn', () => {
  it('accepts a role ARN', () => {
    expect(isIamRoleArn('arn:aws:iam::111122223333:role/TenantConnector')).toBe(true)
  })

  it('rejects empty and non-role ARNs', () => {
    expect(isIamRoleArn('')).toBe(false)
    expect(isIamRoleArn('111122223333')).toBe(false)
    expect(isIamRoleArn('arn:aws:iam::111122223333:user/admin')).toBe(false)
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
    expect(copy?.description).toBe('Accept the resource share in AWS within 12 hours.')
    expect(copy?.shouldShowAcceptLink).toBe(true)
  })

  it('uses destructive copy when only expired', () => {
    const copy = getConnectionsAttentionCopy({ waitingCount: 0, expiredCount: 2 })
    expect(copy?.type).toBe('destructive')
    expect(copy?.title).toBe('Connection requests expired')
    expect(copy?.description).toBe('AWS can no longer accept these shares.')
    expect(copy?.shouldShowAcceptLink).toBe(false)
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
