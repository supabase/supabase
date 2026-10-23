import { safeLocalStorage } from 'common'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  canInterruptRecoveryRoute,
  clearRecoveryReminderSnooze,
  createRecoveryReminderSnooze,
  getRecoveryReminderSeverity,
  getRemainingRecoveryGap,
  isRecoveryReminderSnoozed,
  readRecoveryReminderSnooze,
  resetRecoveryReminderSession,
  writeRecoveryReminderSnooze,
} from './recovery-reminder'

const DAY = 24 * 60 * 60 * 1000
const NOW = 1_000_000

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

describe('recovery reminder cadence', () => {
  it.each([
    ['missing', 'warning', 30],
    ['exhausted', 'critical', 7],
  ] as const)('snoozes %s with %s severity for %i days', (gap, severity, days) => {
    expect(getRecoveryReminderSeverity(gap)).toBe(severity)
    const record = createRecoveryReminderSnooze(gap, NOW)
    expect(record).toEqual({ version: 1, severity, expiresAt: NOW + days * DAY })
    expect(isRecoveryReminderSnoozed(record, gap, record.expiresAt - 1)).toBe(true)
    expect(isRecoveryReminderSnoozed(record, gap, record.expiresAt)).toBe(false)
    expect(isRecoveryReminderSnoozed(record, gap, record.expiresAt + 1)).toBe(false)
  })

  it('lets escalation break a warning snooze', () => {
    const record = createRecoveryReminderSnooze('missing', NOW)
    expect(isRecoveryReminderSnoozed(record, 'exhausted', NOW)).toBe(false)
  })

  it('keeps a critical snooze when the gap becomes less severe', () => {
    expect(
      isRecoveryReminderSnoozed(createRecoveryReminderSnooze('exhausted', NOW), 'missing', NOW)
    ).toBe(true)
  })

  it('does not snooze without a record', () => {
    expect(isRecoveryReminderSnoozed(null, 'missing', NOW)).toBe(false)
  })
})

describe('recovery reminder storage', () => {
  it('persists per user and clears resolved reminders', () => {
    const record = writeRecoveryReminderSnooze('user-a', 'missing', NOW)
    expect(readRecoveryReminderSnooze('user-a')).toEqual(record)
    expect(readRecoveryReminderSnooze('user-b')).toBeNull()
    clearRecoveryReminderSnooze('user-a')
    expect(readRecoveryReminderSnooze('user-a')).toBeNull()
  })

  it.each([
    'not-json',
    '{}',
    '{"version":2,"severity":"warning","expiresAt":999999}',
    '{"version":1,"severity":"info","expiresAt":999999}',
    '{"version":1,"severity":"critical","expiresAt":-1}',
    '{"version":1,"severity":"critical","expiresAt":"999999"}',
  ])('ignores malformed or unsupported records: %s', (value) => {
    safeLocalStorage.setItem('account-recovery-reminder:malformed', value)
    expect(readRecoveryReminderSnooze('malformed')).toBeNull()
  })

  it('uses memory if writes are unavailable, isolated by user', () => {
    vi.spyOn(safeLocalStorage, 'setItem').mockImplementation(() => {})
    const record = writeRecoveryReminderSnooze('blocked-user', 'exhausted', NOW)
    expect(readRecoveryReminderSnooze('blocked-user')).toEqual(record)
    expect(readRecoveryReminderSnooze('other-user')).toBeNull()
    clearRecoveryReminderSnooze('blocked-user')
    expect(readRecoveryReminderSnooze('blocked-user')).toBeNull()
  })

  it('resets memory-only snooze when a sign-in session ends', () => {
    vi.spyOn(safeLocalStorage, 'setItem').mockImplementation(() => {})
    writeRecoveryReminderSnooze('reset-session', 'missing', NOW)
    expect(readRecoveryReminderSnooze('reset-session')).not.toBeNull()
    resetRecoveryReminderSession('reset-session')
    expect(readRecoveryReminderSnooze('reset-session')).toBeNull()
  })

  it('does not restore stale storage when removal fails', () => {
    writeRecoveryReminderSnooze('blocked-removal', 'missing', NOW)
    vi.spyOn(safeLocalStorage, 'removeItem').mockImplementation(() => {})
    clearRecoveryReminderSnooze('blocked-removal')
    expect(readRecoveryReminderSnooze('blocked-removal')).toBeNull()
  })
})

describe('recovery interruption routes', () => {
  it.each([
    '/organizations',
    '/organizations?sort=name#projects',
    '/org/my-org',
    '/org/my-org/settings?tab=billing',
    '/project/my-ref',
    '/project/my-ref/editor?schema=public#table',
    '/project/my-ref/auth/oauth-apps',
    '/project/my-ref/integrations',
    '/new',
    '/new/my-org',
  ])('allows dashboard destination %s', (href) => {
    expect(canInterruptRecoveryRoute(href)).toBe(true)
  })

  it.each([
    '/',
    '/sign-in',
    '/sign-in-mfa',
    '/sign-in-recovery-code',
    '/account/security',
    '/authorize?client_id=example',
    '/integrations/github/authorize',
    '/integrations/vercel/install',
    '/partners/stripe/projects/login',
    '/api/connect',
    '/organizations-other',
    '/org',
    '/project',
    '/project//editor',
    'https://example.com/project/ref',
    '//example.com/project/ref',
    '/project/ref\\evil',
    '/project/ref with spaces',
    '',
  ])('does not interrupt %s', (href) => {
    expect(canInterruptRecoveryRoute(href)).toBe(false)
  })
})

describe('remaining recovery tasks', () => {
  it.each([
    ['missing', false, false, 'missing'],
    ['missing', false, true, 'missing'],
    ['missing', true, false, null],
    ['exhausted', false, false, 'exhausted'],
    ['exhausted', false, true, null],
    ['exhausted', true, false, null],
  ] as const)(
    'evaluates %s after saved=%s and factor=%s',
    (gap, areCodesSaved, isFactorComplete, expected) => {
      expect(
        getRemainingRecoveryGap({
          currentGap: gap,
          activeGap: gap,
          isReadUnavailable: false,
          areCodesSaved,
          isFactorComplete,
        })
      ).toBe(expected)
    }
  )
  it('retains the active gap when status cannot be read', () => {
    expect(
      getRemainingRecoveryGap({
        currentGap: null,
        activeGap: 'missing',
        isReadUnavailable: true,
        areCodesSaved: false,
        isFactorComplete: false,
      })
    ).toBe('missing')
  })
  it('uses refreshed state when a gap escalates or resolves', () => {
    expect(
      getRemainingRecoveryGap({
        currentGap: 'exhausted',
        activeGap: 'missing',
        isReadUnavailable: false,
        areCodesSaved: false,
        isFactorComplete: false,
      })
    ).toBe('exhausted')
    expect(
      getRemainingRecoveryGap({
        currentGap: null,
        activeGap: 'missing',
        isReadUnavailable: false,
        areCodesSaved: false,
        isFactorComplete: false,
      })
    ).toBeNull()
  })
})
