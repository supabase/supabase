import type { components } from '@/data/api'

type PauseStatusResponse = components['schemas']['PauseStatusResponse']

export type PauseStateOverride = 'restorable' | 'restore-disabled'

const STORAGE_KEY = 'devToolbar:pauseStatusOverrides'

const IS_ENABLED =
  process.env.NEXT_PUBLIC_ENVIRONMENT === 'local' ||
  process.env.NEXT_PUBLIC_ENVIRONMENT === 'staging'

function readOverrides(): Record<string, PauseStateOverride> {
  if (!IS_ENABLED || typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Record<string, PauseStateOverride>) : {}
  } catch {
    return {}
  }
}

function writeOverrides(overrides: Record<string, PauseStateOverride>) {
  if (typeof window === 'undefined') return
  if (Object.keys(overrides).length > 0) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides))
  } else {
    window.localStorage.removeItem(STORAGE_KEY)
  }
}

export function getPauseStatusOverride(ref: string | undefined): PauseStateOverride | undefined {
  if (!IS_ENABLED || !ref) return undefined
  return readOverrides()[ref]
}

export function setPauseStatusOverride(ref: string, override: PauseStateOverride) {
  if (!IS_ENABLED) return
  writeOverrides({ ...readOverrides(), [ref]: override })
}

export function clearPauseStatusOverride(ref: string) {
  if (!IS_ENABLED) return
  const overrides = readOverrides()
  delete overrides[ref]
  writeOverrides(overrides)
}

export function buildPauseStatus(override: PauseStateOverride): PauseStatusResponse {
  const isRestorable = override === 'restorable'
  return {
    can_restore: isRestorable,
    last_paused_on: null,
    latest_downloadable_backup_id: null,
    max_days_till_restore_disabled: 90,
    remaining_days_till_restore_disabled: isRestorable ? 78 : 0,
  }
}
