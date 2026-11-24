import dayjs from 'dayjs'

export const FREE_MICRO_UPGRADE_BANNER_SNOOZE_DAYS = 7

/**
 * The banner stays hidden for a fixed window after it was dismissed, then resurfaces.
 * An unparseable or missing timestamp (e.g. a legacy boolean value) counts as not dismissed.
 */
export const isFreeMicroUpgradeBannerSnoozed = (
  dismissedAt: string | null | undefined,
  now: dayjs.ConfigType = dayjs()
) => {
  if (typeof dismissedAt !== 'string') return false
  const dismissed = dayjs(dismissedAt)
  if (!dismissed.isValid()) return false
  return dayjs(now).diff(dismissed, 'day', true) < FREE_MICRO_UPGRADE_BANNER_SNOOZE_DAYS
}
