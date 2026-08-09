import type { components } from '@/data/api'

type ProjectStatus = components['schemas']['ProjectDetailResponse']['status']

const STORAGE_KEY = 'devToolbar:projectStatusOverrides'

const IS_ENABLED =
  process.env.NEXT_PUBLIC_ENVIRONMENT === 'local' ||
  process.env.NEXT_PUBLIC_ENVIRONMENT === 'staging'

function readOverrides(): Record<string, ProjectStatus> {
  if (!IS_ENABLED || typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Record<string, ProjectStatus>) : {}
  } catch {
    return {}
  }
}

function writeOverrides(overrides: Record<string, ProjectStatus>) {
  if (typeof window === 'undefined') return
  if (Object.keys(overrides).length > 0) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides))
  } else {
    window.localStorage.removeItem(STORAGE_KEY)
  }
}

export function getProjectStatusOverride(ref: string | undefined): ProjectStatus | undefined {
  if (!IS_ENABLED || !ref) return undefined
  return readOverrides()[ref]
}

export function setProjectStatusOverride(ref: string, status: ProjectStatus) {
  if (!IS_ENABLED) return
  writeOverrides({ ...readOverrides(), [ref]: status })
}

export function clearProjectStatusOverride(ref: string) {
  if (!IS_ENABLED) return
  const overrides = readOverrides()
  delete overrides[ref]
  writeOverrides(overrides)
}
