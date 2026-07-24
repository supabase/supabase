import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

/**
 * Small transient UI state for the manager, keyed to the current navigation.
 * Holds the row currently being edited so the `/database/:table/edit` route can
 * render a form without serializing the row into the URL.
 */
interface ManagerState {
  editingRow: any | null
  setEditingRow: (row: any | null) => void
}

const ManagerStateContext = createContext<ManagerState | undefined>(undefined)

export function ManagerStateProvider({ children }: { children: ReactNode }) {
  const [editingRow, setEditingRow] = useState<any | null>(null)
  const value = useMemo(() => ({ editingRow, setEditingRow }), [editingRow])
  return <ManagerStateContext.Provider value={value}>{children}</ManagerStateContext.Provider>
}

export function useManagerState() {
  const context = useContext(ManagerStateContext)
  if (!context) {
    throw new Error('useManagerState must be used within a ManagerStateProvider')
  }
  return context
}
