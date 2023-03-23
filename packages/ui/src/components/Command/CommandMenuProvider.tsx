import * as React from 'react'
import { createContext, PropsWithChildren, useContext, useEffect, useState } from 'react'
import { CommandMenu } from './Command'

export interface CommandMenuContextValue {
  isOpen: boolean
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
  isLoading: boolean
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>
}
export const CommandMenuContext = createContext<CommandMenuContextValue>(undefined)
export const useCommandMenu = () => {
  const context = useContext(CommandMenuContext)

  if (context === undefined) {
    throw new Error('useCommandMenu was used outside of CommandMenuProvider')
  }

  return context
}

const CommandMenuProvider = ({ children }: PropsWithChildren<{}>) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useKeyboardEvents({ setIsOpen })

  return (
    <CommandMenuContext.Provider value={{ isOpen, setIsOpen, isLoading, setIsLoading }}>
      {children}
      <CommandMenu />
    </CommandMenuContext.Provider>
  )
}

function useKeyboardEvents({ setIsOpen }: { setIsOpen: (isOpen: boolean) => void }) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      switch (event.key) {
        case 'Escape':
          setIsOpen(false)
          return
        case 'k':
        case '/':
          if (event.metaKey || event.ctrlKey) {
            setIsOpen(true)
          }
          return
      }
    }

    window.addEventListener('keydown', onKeyDown)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [setIsOpen])
}

export default CommandMenuProvider
