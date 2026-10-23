import { useMemo } from 'react'

import type { IssueUserActor } from '@/data/issues/issue-schema'
import { useProfile, useProfileNameAndPicture } from '@/lib/profile'

/** The signed-in user as an issue actor, so the composer shows the same avatar their comments will. */
export function useIssueViewer(): IssueUserActor | undefined {
  const { profile } = useProfile()
  const { avatarUrl } = useProfileNameAndPicture()

  const id = profile?.gotrue_id
  const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ')
  const name = fullName || profile?.username || 'You'

  // Stable between renders so the mock API sync only runs when the viewer changes
  return useMemo<IssueUserActor | undefined>(
    () => (id ? { type: 'user', id, name, avatar_url: avatarUrl ?? null } : undefined),
    [id, name, avatarUrl]
  )
}
