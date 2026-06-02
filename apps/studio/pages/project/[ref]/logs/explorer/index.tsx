import { useParams } from 'common'
import type { NextPage } from 'next'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

const LogsExplorerRedirectPage: NextPage = () => {
  const router = useRouter()
  const { ref } = useParams()

  useEffect(() => {
    if (!ref || !router.isReady) return

    const { q, queryId, its, ite, isHelper, helperText } = router.query
    const params = new URLSearchParams()
    params.set('source', 'logs')

    if (typeof q === 'string') params.set('q', q)
    if (typeof its === 'string') params.set('its', its)
    if (typeof ite === 'string') params.set('ite', ite)
    if (typeof isHelper === 'string') params.set('isHelper', isHelper)
    if (typeof helperText === 'string') params.set('helperText', helperText)

    const targetId = typeof queryId === 'string' ? queryId : 'new'
    router.replace(`/project/${ref}/sql/${targetId}?${params.toString()}`)
  }, [ref, router])

  return null
}

export default LogsExplorerRedirectPage
