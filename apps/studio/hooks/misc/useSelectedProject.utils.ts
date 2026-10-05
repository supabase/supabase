export type OrioleDbReleaseStage = 'alpha' | 'beta'

// OrioleDB engine versions ship as 4-part strings (e.g. `17.11.0.001`), which
// `lib/semver` doesn't parse (it's strict 3-part semver), so compare them separately here.
export const ORIOLEDB_PUBLIC_BETA_VERSION = 'supabase-postgres-17.11.0.001-orioledb'

// Sortable [major, minor, patch, build] key parsed from a dbVersion string like
// `supabase-postgres-17.11.0.001-orioledb` or `supabase-postgres-arm64-17.11.0.001`.
const APP_VERSION_KEY_RE = /^supabase-postgres-(?:arm64-|x86_64-)?(\d+)\.(\d+)\.(\d+)\.(\d+)/

export type AppVersionKey = [number, number, number, number]

// Returns null for non-conforming strings — callers should treat null as "not orderable".
export function parseAppVersionKey(version: string | null | undefined): AppVersionKey | null {
  if (!version) return null

  const match = APP_VERSION_KEY_RE.exec(version)
  if (!match) return null

  return [Number(match[1]), Number(match[2]), Number(match[3]), Number(match[4])]
}

// Negative when `a` is older, zero when equal, positive when newer.
// Throws on unparseable input — null-tolerant callers parse first.
export function compareAppVersions(a: string, b: string): number {
  const keyA = parseAppVersionKey(a)
  const keyB = parseAppVersionKey(b)
  if (!keyA) throw new Error(`unparseable app_version: ${a}`)
  if (!keyB) throw new Error(`unparseable app_version: ${b}`)

  return keyA[0] - keyB[0] || keyA[1] - keyB[1] || keyA[2] - keyB[2] || keyA[3] - keyB[3]
}

export function appVersionAtLeast(version: string, threshold: string): boolean {
  if (!parseAppVersionKey(version)) return false
  return compareAppVersions(version, threshold) >= 0
}

export const isOrioleDbVersionAtLeast = (dbVersion: string | undefined, threshold: string) => {
  if (!dbVersion?.endsWith('orioledb') || !threshold.endsWith('orioledb')) return false
  return appVersionAtLeast(dbVersion, threshold)
}
