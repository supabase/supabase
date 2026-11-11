import { useParams } from 'common'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { LogoLoader } from 'ui'

import { LogPage as PipelinesLogPage } from './pipelines-logs'
import type { NextPageWithLayout } from '@/types'

/** Redirects the previous Pipelines logs URL, keeping its filters, time range, and selection. */
export const LogPage: NextPageWithLayout = () => {
  const { asPath, replace } = useRouter()
  const { ref } = useParams()

  useEffect(() => {
    if (!ref) return
    const query = asPath.split('?')[1] ?? ''
    replace(`/project/${ref}/logs/pipelines-logs${query ? `?${query}` : ''}`)
  }, [asPath, ref, replace])

  return <LogoLoader />
}

LogPage.getLayout = PipelinesLogPage.getLayout

export default LogPage
