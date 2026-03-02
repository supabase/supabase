import dayjs from 'dayjs'
import { describe, expect, it } from 'vitest'

import type { OrganizationMembersData } from 'data/organizations/organization-members-query'
import type { JitUserRuleDraft } from './JitDbAccess.types'
import {
  computeStatusFromGrants,
  createEmptyGrant,
  getJitMemberOptions,
  getRelativeDatetimeByMode,
  serializeDraftRolesForGrantMutation,
} from './JitDbAccess.utils'

describe('jitDbAccess.utils', () => {
  it('returns empty expiry string for never/custom-only fallback modes', () => {
    expect(getRelativeDatetimeByMode('never')).toBe('')
    expect(getRelativeDatetimeByMode('custom')).toBe('')
  })

  it('creates future datetimes for preset expiry modes', () => {
    const inOneHour = dayjs(getRelativeDatetimeByMode('1h'))
    expect(inOneHour.isValid()).toBe(true)
    expect(inOneHour.isAfter(dayjs())).toBe(true)
  })

  it('computes active and expired status counts including IP counts', () => {
    const activeGrant = {
      ...createEmptyGrant('role_active'),
      enabled: true,
      hasExpiry: true,
      expiry: dayjs().add(1, 'day').toISOString(),
      hasIpRestriction: true,
      ipRanges: '192.0.2.0/24',
    }

    const expiredGrant = {
      ...createEmptyGrant('role_expired'),
      enabled: true,
      hasExpiry: true,
      expiry: dayjs().subtract(1, 'day').toISOString(),
      hasIpRestriction: true,
      ipRanges: '203.0.113.0/24',
    }

    const perpetualGrant = {
      ...createEmptyGrant('role_never'),
      enabled: true,
      hasExpiry: false,
      expiryMode: 'never' as const,
      expiry: '',
    }

    expect(computeStatusFromGrants([activeGrant, expiredGrant, perpetualGrant])).toEqual({
      active: 2,
      expired: 1,
      activeIp: 1,
      expiredIp: 1,
    })
  })
})

describe('serializeDraftRolesForGrantMutation', () => {
  it('serializes supported role fields and omits prototype-only IP fields', () => {
    const expiry = '2026-06-01T12:00:00.000Z'
    const draft: JitUserRuleDraft = {
      memberId: 'user-1',
      grants: [
        {
          ...createEmptyGrant('postgres'),
          enabled: true,
          hasExpiry: true,
          expiryMode: 'custom',
          expiry,
          hasIpRestriction: true,
          ipRanges: '192.0.2.0/24',
        },
        {
          ...createEmptyGrant('supabase_read_only_user'),
          enabled: true,
          hasExpiry: false,
          expiryMode: 'never',
          expiry: '',
        },
        {
          ...createEmptyGrant('ignored_disabled'),
          enabled: false,
        },
      ],
    }

    expect(serializeDraftRolesForGrantMutation(draft)).toEqual([
      {
        role: 'postgres',
        expires_at: dayjs(expiry).unix(),
      },
      {
        role: 'supabase_read_only_user',
      },
    ])
  })
})

describe('getJitMemberOptions', () => {
  it('excludes invited org members without gotrue IDs from selectable options', () => {
    const organizationMembers: OrganizationMembersData = [
      {
        gotrue_id: 'de305d54-75b4-431b-adb2-eb6b9e546014',
        primary_email: 'active@example.com',
        username: 'Active User',
      },
      {
        invited_id: 123,
        invited_at: '2026-03-01T00:00:00.000Z',
        primary_email: 'expired-invite@example.com',
        username: 'e',
      },
    ]

    expect(getJitMemberOptions(organizationMembers, [])).toEqual([
      {
        id: 'de305d54-75b4-431b-adb2-eb6b9e546014',
        email: 'active@example.com',
        name: 'Active User',
      },
    ])
  })
})
