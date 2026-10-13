import { useCallback, useEffect, useRef, useState } from 'react'

import type { UploadConflictResolution } from './StorageExplorer.utils'

/**
 * Turns the upload's name clash into a question the user answers in a modal. The upload is
 * already in flight by then, so it awaits the returned promise rather than being restarted.
 */
export const useUploadConflictPrompt = () => {
  const [conflictingNames, setConflictingNames] = useState<string[]>([])
  const resolveRef = useRef<((resolution: UploadConflictResolution) => void) | undefined>(undefined)

  // An unmount mid-prompt would otherwise leave the upload waiting on a modal nobody can see.
  useEffect(() => () => resolveRef.current?.('cancel'), [])

  const promptForConflicts = useCallback((names: string[]) => {
    setConflictingNames(names)
    return new Promise<UploadConflictResolution>((resolve) => {
      resolveRef.current = resolve
    })
  }, [])

  const resolveConflicts = useCallback((resolution: UploadConflictResolution) => {
    setConflictingNames([])
    resolveRef.current?.(resolution)
    resolveRef.current = undefined
  }, [])

  return { conflictingNames, promptForConflicts, resolveConflicts }
}
