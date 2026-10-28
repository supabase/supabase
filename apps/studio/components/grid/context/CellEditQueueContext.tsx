import { createContext, useContext } from 'react'

import { useIsQueueOperationsEnabled } from '@/components/interfaces/Account/Preferences/useDashboardSettings'

const CellEditQueueContext = createContext<boolean | undefined>(undefined)

/**
 * Marks the cell editors below it as queuing their edits for review, regardless of the
 * Table Editor's queue preference — for surfaces such as Explorer results, where an inline
 * edit is always staged and saved together with the others.
 */
export const CellEditQueueProvider = CellEditQueueContext.Provider

/** Whether a cell editor's apply action queues the edit rather than writing it straight away. */
export function useIsCellEditQueued() {
  const isQueueOperationsEnabled = useIsQueueOperationsEnabled()
  return useContext(CellEditQueueContext) ?? isQueueOperationsEnabled
}
