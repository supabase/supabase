import { useCallback, useEffect, useRef, useState } from 'react'

import type { UploadConflictResolution, UploadConflicts } from './StorageExplorer.utils'

const NO_CONFLICTS: UploadConflicts = {
  liveNames: [],
  archivedNames: [],
  isVersioningSuspended: false,
}

/**
 * Turns the upload's name clash into a question the user answers in a modal. The upload is
 * already in flight by then, so it awaits the returned promise rather than being restarted.
 */
export const useUploadConflictPrompt = () => {
  const [conflicts, setConflicts] = useState<UploadConflicts>(NO_CONFLICTS)
  const resolveRef = useRef<((resolution: UploadConflictResolution) => void) | undefined>(undefined)

  // An unmount mid-prompt would otherwise leave the upload waiting on a modal nobody can see.
  useEffect(() => () => resolveRef.current?.('cancel'), [])

  const promptForConflicts = useCallback((nextConflicts: UploadConflicts) => {
    // Two uploads can be in flight at once, and only one modal can be on screen. Without
    // this the earlier upload would wait on a promise nothing resolves, silently forever.
    resolveRef.current?.('cancel')
    setConflicts(nextConflicts)
    return new Promise<UploadConflictResolution>((resolve) => {
      resolveRef.current = resolve
    })
  }, [])

  const resolveConflicts = useCallback((resolution: UploadConflictResolution) => {
    setConflicts(NO_CONFLICTS)
    resolveRef.current?.(resolution)
    resolveRef.current = undefined
  }, [])

  return { conflicts, promptForConflicts, resolveConflicts }
}
