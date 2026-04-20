import { describe, expect, test } from 'vitest'

import {
  buildProjectPayload,
  buildSsoPayload,
  categorizeInviteEmails,
  emailSchema,
  MAX_BATCH_INVITE_SIZE,
  parseEmails,
} from '@/components/interfaces/Organization/TeamSettings/InviteMemberButton.utils'
import type { OrganizationMember } from '@/data/organizations/organization-members-query'

describe('parseEmails', () => {
  test('parses a single email', () => {
    expect(parseEmails('user@example.com')).toStrictEqual(['user@example.com'])
  })

  test('parses multiple comma-separated emails', () => {
    expect(parseEmails('a@example.com,b@example.com,c@example.com')).toStrictEqual([
      'a@example.com',
      'b@example.com',
      'c@example.com',
    ])
  })

  test('trims whitespace around each email', () => {
    expect(parseEmails(' a@example.com , b@example.com ')).toStrictEqual([
      'a@example.com',
      'b@example.com',
    ])
  })

  test('filters out empty entries from trailing, leading, or double commas', () => {
    expect(parseEmails(',a@example.com,,b@example.com,')).toStrictEqual([
      'a@example.com',
      'b@example.com',
    ])
  })

  test('removes duplicate email addresses', () => {
    expect(parseEmails('a@example.com,a@example.com')).toStrictEqual(['a@example.com'])
  })

  test('returns an empty array for an empty string', () => {
    expect(parseEmails('')).toStrictEqual([])
  })

  test('returns an empty array for a whitespace-only string', () => {
    expect(parseEmails('   ')).toStrictEqual([])
  })

  test('returns an empty array for commas only', () => {
    expect(parseEmails(',,,,')).toStrictEqual([])
  })

  test('parses space-separated emails', () => {
    expect(parseEmails('a@example.com b@example.com')).toStrictEqual([
      'a@example.com',
      'b@example.com',
    ])
  })

  test('parses line breaks and mixed comma or space separators', () => {
    expect(parseEmails('a@example.com\nb@example.com, c@example.com')).toStrictEqual([
      'a@example.com',
      'b@example.com',
      'c@example.com',
    ])
  })
})

function makeMember(overrides: Partial<OrganizationMember> = {}): OrganizationMember {
  return {
    gotrue_id: 'gotrue-1',
    primary_email: 'member@example.com',
    role_ids: [1],
    username: 'member',
    ...overrides,
  } as OrganizationMember
}

describe('categorizeInviteEmails', () => {
  test('places a new email in toInvite when no members exist', () => {
    expect(categorizeInviteEmails(['new@example.com'], [])).toStrictEqual({
      alreadyInvited: [],
      alreadyMembers: [],
      toInvite: ['new@example.com'],
    })
  })

  test('places an email in alreadyMembers when that member exists without an invited_id', () => {
    const members = [makeMember({ primary_email: 'existing@example.com' })]
    expect(categorizeInviteEmails(['existing@example.com'], members)).toStrictEqual({
      alreadyInvited: [],
      alreadyMembers: ['existing@example.com'],
      toInvite: [],
    })
  })

  test('places an email in alreadyInvited when that member has an invited_id', () => {
    const members = [makeMember({ primary_email: 'invited@example.com', invited_id: 42 })]
    expect(categorizeInviteEmails(['invited@example.com'], members)).toStrictEqual({
      alreadyInvited: ['invited@example.com'],
      alreadyMembers: [],
      toInvite: [],
    })
  })

  test('correctly categorizes a mixed batch', () => {
    const members = [
      makeMember({ primary_email: 'member@example.com' }),
      makeMember({ primary_email: 'invited@example.com', invited_id: 7 }),
    ]
    expect(
      categorizeInviteEmails(
        ['new@example.com', 'member@example.com', 'invited@example.com'],
        members
      )
    ).toStrictEqual({
      alreadyInvited: ['invited@example.com'],
      alreadyMembers: ['member@example.com'],
      toInvite: ['new@example.com'],
    })
  })

  test('places all emails in toInvite when none match existing members', () => {
    const members = [makeMember({ primary_email: 'other@example.com' })]
    expect(
      categorizeInviteEmails(['a@example.com', 'b@example.com', 'c@example.com'], members)
    ).toStrictEqual({
      alreadyInvited: [],
      alreadyMembers: [],
      toInvite: ['a@example.com', 'b@example.com', 'c@example.com'],
    })
  })

  test('returns all-empty for an empty email list', () => {
    expect(categorizeInviteEmails([], [makeMember()])).toStrictEqual({
      alreadyInvited: [],
      alreadyMembers: [],
      toInvite: [],
    })
  })

  test('uses strict equality — does not match different casing', () => {
    // The component lowercases emails before calling this function,
    // so 'member@example.com' must NOT match 'Member@Example.com'
    const members = [makeMember({ primary_email: 'Member@Example.com' })]
    const result = categorizeInviteEmails(['member@example.com'], members)
    expect(result.toInvite).toStrictEqual(['member@example.com'])
    expect(result.alreadyMembers).toStrictEqual([])
  })
})

describe('buildProjectPayload', () => {
  test('returns empty object when applyToOrg is true', () => {
    expect(buildProjectPayload(true, 'ref_abc')).toStrictEqual({})
  })

  test('throws an error when applyToOrg is false but projectRef is empty', () => {
    expect(() => buildProjectPayload(false, '')).toThrowError(
      'projectRef is required when applyToOrg is false'
    )
  })

  test('returns projects array when applyToOrg is false and projectRef is set', () => {
    expect(buildProjectPayload(false, 'ref_abc')).toStrictEqual({ projects: ['ref_abc'] })
  })

  test('wraps the projectRef in a single-element array', () => {
    expect(buildProjectPayload(false, 'my-project-ref')).toStrictEqual({
      projects: ['my-project-ref'],
    })
  })
})

describe('buildSsoPayload', () => {
  test('returns empty object for "auto"', () => {
    expect(buildSsoPayload('auto')).toStrictEqual({})
  })

  test('returns { requireSso: true } for "sso"', () => {
    expect(buildSsoPayload('sso')).toStrictEqual({ requireSso: true })
  })

  test('returns { requireSso: false } for "non-sso"', () => {
    expect(buildSsoPayload('non-sso')).toStrictEqual({ requireSso: false })
  })
})

function makeEmailList(count: number): string {
  return Array.from({ length: count }, (_, i) => `user${i + 1}@example.com`).join(', ')
}

function makeEmailListSpaceSeparated(count: number): string {
  return Array.from({ length: count }, (_, i) => `user${i + 1}@example.com`).join(' ')
}

describe('emailSchema', () => {
  test('accepts a single valid email', () => {
    expect(emailSchema.safeParse('user@example.com').success).toBe(true)
  })

  test('accepts exactly 50 emails', () => {
    expect(emailSchema.safeParse(makeEmailList(MAX_BATCH_INVITE_SIZE)).success).toBe(true)
  })

  test('rejects 51 emails — singular "address" when exactly 1 needs removing', () => {
    const result = emailSchema.safeParse(makeEmailList(51))
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        'You can invite up to 50 members at a time. Remove 1 email address to continue.'
      )
    }
  })

  test('rejects 51 space-separated emails (same as comma-separated batch limit)', () => {
    const result = emailSchema.safeParse(makeEmailListSpaceSeparated(51))
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        'You can invite up to 50 members at a time. Remove 1 email address to continue.'
      )
    }
  })

  test('rejects 99 emails — plural "addresses" when more than 1 needs removing', () => {
    const result = emailSchema.safeParse(makeEmailList(99))
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        'You can invite up to 50 members at a time. Remove 49 email addresses to continue.'
      )
    }
  })

  test('rejects an empty string', () => {
    const result = emailSchema.safeParse('')
    expect(result.success).toBe(false)
  })

  test('rejects an invalid email address and names it', () => {
    const result = emailSchema.safeParse('notanemail')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Invalid email address: "notanemail"')
    }
  })

  test('truncates a very long invalid token in the error message', () => {
    const longToken = `${'x'.repeat(130)}@`
    const result = emailSchema.safeParse(longToken)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message.startsWith('Invalid email address: "')).toBe(true)
      expect(result.error.issues[0].message.endsWith('…"')).toBe(true)
      expect(result.error.issues[0].message.length).toBeLessThan(longToken.length + 50)
    }
  })
})
