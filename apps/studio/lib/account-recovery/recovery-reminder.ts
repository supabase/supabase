import { safeLocalStorage } from 'common'
import { z } from 'zod'

export type RecoveryReminderGap = 'missing' | 'exhausted'

const snoozeSchema = z.object({
  version: z.literal(1),
  severity: z.enum(['critical', 'warning']),
  expiresAt: z.number().finite().nonnegative(),
})
export type RecoveryReminderSnooze = z.infer<typeof snoozeSchema>

const DAY = 24 * 60 * 60 * 1000
const fallback = new Map<string, RecoveryReminderSnooze | null>()
const getStorageKey = (userId: string) => `account-recovery-reminder:${userId}`

export function getRecoveryReminderSeverity(gap: RecoveryReminderGap) {
  return gap === 'exhausted' ? 'critical' : 'warning'
}

export function createRecoveryReminderSnooze(
  gap: RecoveryReminderGap,
  now = Date.now()
): RecoveryReminderSnooze {
  return {
    version: 1,
    severity: getRecoveryReminderSeverity(gap),
    expiresAt: now + (gap === 'exhausted' ? 7 : 30) * DAY,
  }
}

export function isRecoveryReminderSnoozed(
  record: RecoveryReminderSnooze | null,
  gap: RecoveryReminderGap,
  now = Date.now()
) {
  if (!record || record.expiresAt <= now) return false
  return record.severity === 'critical' || gap === 'missing'
}

export function readRecoveryReminderSnooze(userId: string): RecoveryReminderSnooze | null {
  const key = getStorageKey(userId)
  if (fallback.has(key)) return fallback.get(key) ?? null
  const value = safeLocalStorage.getItem(key)
  if (!value) return null
  try {
    const result = snoozeSchema.safeParse(JSON.parse(value))
    return result.success ? result.data : null
  } catch {
    return null
  }
}

export function writeRecoveryReminderSnooze(
  userId: string,
  gap: RecoveryReminderGap,
  now = Date.now()
) {
  const key = getStorageKey(userId)
  const record = createRecoveryReminderSnooze(gap, now)
  const value = JSON.stringify(record)
  safeLocalStorage.setItem(key, value)
  if (safeLocalStorage.getItem(key) === value) fallback.delete(key)
  else fallback.set(key, record)
  return record
}

export function clearRecoveryReminderSnooze(userId: string) {
  const key = getStorageKey(userId)
  safeLocalStorage.removeItem(key)
  fallback.set(key, null)
}

export function canInterruptRecoveryRoute(href: string) {
  if (!href.startsWith('/') || href.startsWith('//') || /[\\\s]/.test(href)) return false
  try {
    const { pathname } = new URL(href, 'https://studio.local')
    return (
      pathname === '/organizations' ||
      pathname === '/new' ||
      /^\/(org|project|new)\/[^/]+(?:\/|$)/.test(pathname)
    )
  } catch {
    return false
  }
}

export function getRemainingRecoveryGap({
  currentGap,
  activeGap,
  isReadUnavailable,
  areCodesSaved,
  isFactorComplete,
}: {
  currentGap: RecoveryReminderGap | null
  activeGap: RecoveryReminderGap
  isReadUnavailable: boolean
  areCodesSaved: boolean
  isFactorComplete: boolean
}): RecoveryReminderGap | null {
  if (areCodesSaved) return null
  const remainingGap = isReadUnavailable ? activeGap : currentGap
  if (remainingGap === 'exhausted' && isFactorComplete) return null
  return remainingGap
}

export function resetRecoveryReminderSession(userId: string) {
  fallback.delete(getStorageKey(userId))
}
