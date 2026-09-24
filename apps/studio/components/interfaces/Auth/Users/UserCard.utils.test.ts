import { describe, expect, it } from 'vitest'

import { getUserInitials, getUserPrimaryLabel } from './UserCard.utils'
import type { User } from '@/data/auth/users-infinite-query'

const user = (overrides: Partial<User>) => ({ id: 'u1', providers: [], ...overrides }) as User

describe('getUserInitials', () => {
  it('uses the first and last words of the display name', () => {
    expect(getUserInitials(user({ raw_user_meta_data: { full_name: 'Ada King Lovelace' } }))).toBe(
      'AL'
    )
    expect(getUserInitials(user({ raw_user_meta_data: { name: 'ada' } }))).toBe('A')
  })

  it('falls back to the first letter of the email', () => {
    expect(getUserInitials(user({ email: 'grace@example.com' }))).toBe('G')
  })

  it('falls back to email for whitespace-only names', () => {
    expect(
      getUserInitials(user({ raw_user_meta_data: { name: '  ' }, email: 'ada@example.com' }))
    ).toBe('A')
  })

  it('is empty when there is nothing to draw from', () => {
    expect(getUserInitials(user({ phone: '+6421000000' }))).toBe('')
  })
})

describe('getUserPrimaryLabel', () => {
  it('prefers the display name, then email, then phone', () => {
    expect(
      getUserPrimaryLabel(user({ email: 'ada@example.com', raw_user_meta_data: { name: 'Ada' } }))
    ).toBe('Ada')
    expect(getUserPrimaryLabel(user({ email: 'ada@example.com' }))).toBe('ada@example.com')
    expect(getUserPrimaryLabel(user({ phone: '+6421000000' }))).toBe('+6421000000')
    expect(getUserPrimaryLabel(user({ is_anonymous: true }))).toBe('Anonymous user')
  })
})
