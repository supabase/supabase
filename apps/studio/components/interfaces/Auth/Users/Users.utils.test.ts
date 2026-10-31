import { describe, expect, it } from 'vitest'

import { formatUsersData, providerIconMap } from './Users.utils'
import type { User } from '@/data/auth/users-infinite-query'
import { BASE_PATH } from '@/lib/constants'

describe('Users.utils - providerIconMap', () => {
  it('maps phone providers to their correct brand icons', () => {
    expect(providerIconMap.twilio).toBe('twilio-icon')
    expect(providerIconMap.messagebird).toBe('messagebird-icon')
    expect(providerIconMap.vonage).toBe('vonage-icon')
    expect(providerIconMap.twilioverify).toBe('twilio-icon')
  })

  it('resolves correct provider_icons paths in formatUsersData for phone providers', () => {
    const mockUsers: User[] = [
      {
        id: 'user-vonage',
        email: 'user1@example.com',
        phone: '+1234567890',
        created_at: '2026-01-01T00:00:00Z',
        last_sign_in_at: '2026-01-02T00:00:00Z',
        is_anonymous: false,
        providers: ['vonage'],
        raw_app_meta_data: { provider: 'vonage' },
        raw_user_meta_data: {},
      } as unknown as User,
      {
        id: 'user-twilioverify',
        email: 'user2@example.com',
        phone: '+1987654321',
        created_at: '2026-01-01T00:00:00Z',
        last_sign_in_at: '2026-01-02T00:00:00Z',
        is_anonymous: false,
        providers: ['twilioverify'],
        raw_app_meta_data: { provider: 'twilioverify' },
        raw_user_meta_data: {},
      } as unknown as User,
    ]

    const formatted = formatUsersData(mockUsers)

    expect(formatted[0].provider_icons).toEqual([`${BASE_PATH}/img/icons/vonage-icon.svg`])
    expect(formatted[1].provider_icons).toEqual([`${BASE_PATH}/img/icons/twilio-icon.svg`])
  })
})
