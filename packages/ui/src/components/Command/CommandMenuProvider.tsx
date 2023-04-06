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
  currentPage?: string
  site: 'studio' | 'docs'

  // to do: remove this prop
  // this is a temporary hack as ReactMarkdown fails our jest tests if we import the package within this UI package
  MarkdownHandler: (props: any) => React.ReactNode // to do: remove this. although it breaks our jest tests
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

const CommandMenuProvider = ({
  children,
  site,
  MarkdownHandler,
}: PropsWithChildren<{
  site: 'studio' | 'docs'
  // to do: remove this prop
  // this is a temporary hack as ReactMarkdown fails our jest tests if we import the package within this UI package
  MarkdownHandler: (props: any) => React.ReactNode
}>) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [search, setSearch] = React.useState('')
  const [pages, setPages] = React.useState<string[]>([])
  const { toggleTheme } = useTheme()
  const currentPage = pages[pages.length - 1]

  const actions: CommandMenuActions = {
    toggleTheme,
  }

  useKeyboardEvents({ setIsOpen, currentPage, setSearch, setPages })

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
        currentPage,
        site,
        MarkdownHandler,
      }}
    >
      {children}
      <CommandMenu />
    </CommandMenuContext.Provider>
  )
}
function useKeyboardEvents({
  setIsOpen,
  currentPage,
  setSearch,
  setPages,
}: {
  setIsOpen: (isOpen: boolean) => void
  setSearch: React.Dispatch<React.SetStateAction<string>>
  setPages: React.Dispatch<React.SetStateAction<string[]>>
  currentPage?: string
}) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      switch (event.key) {
        case 'Escape':
          event.preventDefault()
          // if on homepage, close the command palette
          if (!currentPage) setIsOpen(false)
          setSearch('')
          // if NOT on homepage, return to last page
          setPages((pages) => pages.slice(0, -1))
          return
        case 'k':
        case '/':
          if (event.metaKey || event.ctrlKey) {
            // Some browsers (ie. firefox) will focus the address bar by default
            event.preventDefault()

            setIsOpen(true)
          }
          return
      }
    }

    window.addEventListener('keydown', onKeyDown)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [setIsOpen, currentPage])
}

export default CommandMenuProvider
