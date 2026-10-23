import { useNavigate } from '@tanstack/react-router'
import { useParams } from 'common'
import { useEffect } from 'react'

import type { IssueCategory } from '@/data/issues/issue-schema'

/** The per-category advisor pages became filtered views of the issues list. */
export const IssuesCategoryRedirect = ({ category }: { category: IssueCategory }) => {
  const navigate = useNavigate()
  const { ref } = useParams()

  useEffect(() => {
    if (!ref) return
    navigate({ to: '/project/$ref/issues', params: { ref }, search: { category }, replace: true })
  }, [ref, navigate, category])

  return null
}
