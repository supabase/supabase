import { useLocalStorage } from 'hooks/misc/useLocalStorage'
import { createContext, Dispatch, SetStateAction, useContext } from 'react'

interface ControlsContextType {
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
}

export const ControlsContext = createContext<ControlsContextType | null>(null)

export function ControlsProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useLocalStorage('data-table-controls', true)

  return (
    <ControlsContext.Provider value={{ open, setOpen }}>
      <div
        // REMINDER: access the data-expanded state with tailwind via `group-data-[expanded=true]/controls:block`
        // In tailwindcss v4, we could even use `group-data-expanded/controls:block`
        className="group/controls h-full"
        data-expanded={open}
      >
        {children}
      </div>
    </ControlsContext.Provider>
  )
}

export function useControls() {
  const context = useContext(ControlsContext)

  if (!context) {
    throw new Error('useControls must be used within a ControlsProvider')
  }

  return context as ControlsContextType
}
