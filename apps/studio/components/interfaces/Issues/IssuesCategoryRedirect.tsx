import { useParams } from 'common'
import { useEffect } from 'react'

import { replaceIssuesLocation } from './IssuesLegacyRedirect'
import { getIssuesCategoryDestination } from './IssuesLegacyRedirect.utils'
import type { IssueCategory } from '@/data/issues/issue.types'
import { BASE_PATH } from '@/lib/constants'

export const IssuesCategoryRedirect = ({
  category,
  onRedirect = replaceIssuesLocation,
}: {
  category: IssueCategory
  onRedirect?: (destination: string) => void
}) => {
  const { ref } = useParams()

  useEffect(() => {
    if (!ref) return
    onRedirect(
      getIssuesCategoryDestination(
        new URL(window.location.href),
        category,
        `${BASE_PATH}/project/${encodeURIComponent(ref)}/issues`
      )
    )
  }, [ref, category, onRedirect])

  return null
}
