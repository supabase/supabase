import { useParams } from 'common'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

import type { NextPageWithLayout } from '@/types'

const NotebookBlockRedirectPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref, notebookId } = useParams()

  useEffect(() => {
    if (!ref || !notebookId) return
    router.replace(`/project/${ref}/sql/notebooks/${notebookId}`)
  }, [ref, notebookId, router])

  return null
}

export default NotebookBlockRedirectPage
