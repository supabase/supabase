'use client'

import { LogsPreviewer } from '@/components/interfaces/Settings/Logs/LogsPreviewer'
import { useParams } from 'next/navigation'

export default function ObsLogsAuthPage() {
  const params = useParams()
  const projectRef = params?.projectRef as string | undefined

  if (!projectRef) return null

  return <LogsPreviewer condensedLayout projectRef={projectRef} queryType="auth" />
}
