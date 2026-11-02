import { compareAppVersions, parseAppVersionKey } from '@/hooks/misc/useSelectedProject.utils'

/**
 * First build of each engine on the current collation-library lineage (ICU and glibc were bumped
 * for every engine at once). Text indexes built on an earlier build are ordered by the old
 * libraries, so a database moving onto a build at or above the boundary reports a collation
 * version mismatch. Mirrors the platform's upgrade eligibility check.
 */
const COLLATION_LINEAGE_BOUNDARY: Record<number, string> = {
  15: 'supabase-postgres-15.14.1.072',
  17: 'supabase-postgres-17.6.1.072',
}
const ORIOLE_COLLATION_LINEAGE_BOUNDARY = 'supabase-postgres-17.6.0.029-orioledb'

/** Whether a build predates the current collation lineage. Null when the version isn't orderable. */
export const predatesCollationLineage = (version: string | undefined): boolean | null => {
  if (!version) return null
  const key = parseAppVersionKey(version)
  if (!key) return null

  if (version.includes('orioledb')) {
    return compareAppVersions(version, ORIOLE_COLLATION_LINEAGE_BOUNDARY) < 0
  }

  const major = key[0]
  // PG18+ only ever shipped on the current lineage.
  if (major >= 18) return false
  const boundary = COLLATION_LINEAGE_BOUNDARY[major]
  // PG14 and older predate the lineage entirely.
  if (boundary === undefined) return true
  return compareAppVersions(version, boundary) < 0
}

/**
 * Whether upgrading from `sourceVersion` to any of `targetVersions` crosses the lineage boundary:
 * the source predates it and a target is on it. An absent or unparseable source is treated as
 * pre-lineage.
 */
export const crossesCollationLineageBoundary = ({
  sourceVersion,
  targetVersions,
}: {
  sourceVersion: string | undefined
  targetVersions: string[]
}): boolean => {
  if (predatesCollationLineage(sourceVersion) === false) return false
  return targetVersions.some((version) => predatesCollationLineage(version) === false)
}
