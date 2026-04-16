import { describe, expect, it } from 'vitest'

import type { AdvisorSignalItem } from './AdvisorPanel.types'
import {
  createAdvisorLintItems,
  createAdvisorNotificationItems,
  getAdvisorItemSecondaryText,
  sortAdvisorItems,
} from './AdvisorPanel.utils'
import type { Lint } from '@/data/lint/lint-query'
import type { Notification } from '@/data/notifications/notifications-v2-query'

const createLint = (overrides: Partial<Lint> = {}): Lint =>
  ({
    cache_key: 'lint-1',
    name: 'unknown_lint',
    detail: 'Critical lint detail',
    level: 'ERROR',
    categories: ['SECURITY'],
    metadata: {},
    ...overrides,
  }) as Lint

const createNotification = (overrides: Partial<Notification> = {}): Notification =>
  ({
    id: 'notification-1',
    inserted_at: '2026-03-01T00:00:00.000Z',
    priority: 'Info',
    status: 'seen',
    data: {
      title: 'Notification title',
      message: 'Notification body',
      actions: [],
    },
    ...overrides,
  }) as Notification

const createBannedIPSignalItem = (ip: string): AdvisorSignalItem => ({
  id: `signal:banned-ip:${ip}:v1`,
  dismissalKey: `signal:banned-ip:${ip}:v1`,
  source: 'signal',
  type: 'banned-ip',
  severity: 'warning',
  tab: 'security',
  title: 'Banned IP address',
  summary: `The IP address \`${ip}\` is temporarily blocked.`,
  docsUrl: 'https://supabase.com/docs/reference/cli/supabase-network-bans',
  actions: [],
  sourceData: { type: 'banned-ip', ip },
})

describe('AdvisorPanel.utils', () => {
  it('orders mixed lint, signal and notification items by severity and recency', () => {
    const lintItems = createAdvisorLintItems([
      createLint({ cache_key: 'lint-critical', detail: 'Critical lint detail' }),
    ])
    const signalItems = [createBannedIPSignalItem('203.0.113.10')]
    const notificationItems = createAdvisorNotificationItems([
      createNotification({
        id: 'notification-info',
        data: { title: 'Notification title', message: 'Body', actions: [] },
      }),
    ])

    const sorted = sortAdvisorItems([...notificationItems, ...signalItems, ...lintItems])

    expect(sorted.map((item) => item.source)).toEqual(['lint', 'signal', 'notification'])
  })

  it('uses database surface-area metadata and the IP address for banned IP signals', () => {
    const bannedIpSignal = createBannedIPSignalItem('203.0.113.10')
    expect(getAdvisorItemSecondaryText(bannedIpSignal)).toBe('Database · 203.0.113.10')
  })
})
