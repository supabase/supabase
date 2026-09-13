import type { SafeSqlFragment } from '@supabase/pg-meta'

export function trimSafeSqlFragment(fragment: SafeSqlFragment): SafeSqlFragment
export function trimSafeSqlFragment(fragment: SafeSqlFragment | null): SafeSqlFragment | null
export function trimSafeSqlFragment(
  fragment: SafeSqlFragment | undefined
): SafeSqlFragment | undefined
export function trimSafeSqlFragment(
  fragment: SafeSqlFragment | null | undefined
): SafeSqlFragment | null | undefined {
  if (fragment == null) return fragment
  return fragment.trim() as SafeSqlFragment
}
