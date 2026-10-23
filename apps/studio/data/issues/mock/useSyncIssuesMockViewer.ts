import { useEffect } from 'react'

import { setIssuesMockViewer } from './issues-mock-api'
import { useIssueViewer } from '@/components/interfaces/Issues/useIssueViewer'

/** Tells the mock Issues API who is signed in, standing in for the auth token a real API reads. */
export function useSyncIssuesMockViewer() {
  const viewer = useIssueViewer()

  useEffect(() => {
    if (viewer) setIssuesMockViewer(viewer)
  }, [viewer])
}
