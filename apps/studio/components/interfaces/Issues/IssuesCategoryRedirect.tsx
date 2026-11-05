import { useParams } from 'common'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

import type { IssueCategory } from '@/data/issues/issue.types'

/** The per-category advisor pages became filtered views of the issues list. */
export const IssuesCategoryRedirect = ({ category }: { category: IssueCategory }) => {
  const router = useRouter()
  const { ref } = useParams()

  useEffect(() => {
    if (!ref) return
    router.replace(`/project/${ref}/issues?category=${category}`)
  }, [ref, router, category])

  return null
}
