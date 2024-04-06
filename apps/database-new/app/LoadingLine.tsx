'use client'

import { useAppStateSnapshot } from '@/lib/state'
import { usePathname, useParams } from 'next/navigation'
import { LoadingLine as LoadingLineComponent } from 'ui'

function LoadingLine() {
  const snap = useAppStateSnapshot()
  const params = useParams()
  const pathName = usePathname()

  const runId = params.runId as string

  const loading =
    runId && snap.runsLoading.includes(runId) && pathName.includes(runId) ? true : false

  return <LoadingLineComponent loading={loading} />
}

export { LoadingLine }
