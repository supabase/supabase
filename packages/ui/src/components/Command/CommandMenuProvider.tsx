import { useTheme, UseThemeProps } from 'common'
import * as React from 'react'
import { createContext, PropsWithChildren, useContext, useEffect, useState } from 'react'
import CommandMenu from './CommandMenu'

export interface CommandMenuContextValue {
  isOpen: boolean
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
  isLoading: boolean
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>
  actions: CommandMenuActions
  search: string
  setSearch: React.Dispatch<React.SetStateAction<string>>
  pages: string[]
  setPages: React.Dispatch<React.SetStateAction<string[]>>
  page: string
}
export const CommandMenuContext = createContext<CommandMenuContextValue | undefined>(undefined)
export const useCommandMenu = () => {
  const context = useContext(CommandMenuContext)

  if (context === undefined) {
    throw new Error('useCommandMenu was used outside of CommandMenuProvider')
  }

  return context
}

export interface CommandMenuActions {
  toggleTheme: UseThemeProps['toggleTheme']
}

const CommandMenuProvider = ({ children }: PropsWithChildren<{}>) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [search, setSearch] = React.useState('')
  const [pages, setPages] = React.useState([])
  const { toggleTheme } = useTheme()
  const page = pages[pages.length - 1]

  const actions: CommandMenuActions = {
    toggleTheme,
  }

  useKeyboardEvents({ setIsOpen, page, setSearch, setPages })

  return (
    <CommandMenuContext.Provider
      value={{
        isOpen,
        setIsOpen,
        isLoading,
        setIsLoading,
        actions,
        setSearch,
        search,
        pages,
        setPages,
        page,
      }}
    >
      {children}
      <CommandMenu />
    </CommandMenuContext.Provider>
  )
}

function useKeyboardEvents({
  setIsOpen,
  page,
  setSearch,
  setPages,
}: {
  setIsOpen: (isOpen: boolean) => void
  setSearch: React.Dispatch<React.SetStateAction<string>>
  setPages: React.Dispatch<React.SetStateAction<string[]>>
  page: string
}) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      switch (event.key) {
        case 'Escape':
          event.preventDefault()
          // if on homepage, close the command palette
          if (!page) setIsOpen(false)
          setSearch('')
          // if NOT on homepage, return to last page
          setPages((pages) => pages.slice(0, -1))
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
  }, [setIsOpen, page])
}

export default CommandMenuProvider
