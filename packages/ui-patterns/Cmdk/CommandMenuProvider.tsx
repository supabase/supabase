'use client'

import dynamic from 'next/dynamic'
import { ElementRef, PropsWithChildren, useEffect, useRef, useState } from 'react'
import { CommandInput } from './Command.utils'
import { CommandMenuContext } from './CommandMenuContext'

// `CommandMenu` is heavy - code split to reduce app bundle size
const CommandMenu = dynamic(() => import('./CommandMenu'), {
  loading: () => <p>Loading...</p>,
})

export interface CommandMenuProviderProps {
  site: 'studio' | 'docs' | 'website'
  projectRef?: string
  /**
   * Project's API keys, for easy access through CMDK
   */
  apiKeys?: { anon?: string; service?: string }
  apiUrl?: string
  /**
   * Opt in flag to use additional metadata in AI prompts
   */
  isOptedInToAI?: boolean
  /**
   * Any additional metadata that CMDK component can use in its AI prompts
   */
  metadata?: { definitions?: string; flags?: { [key: string]: string } }
  /**
   * Call back when save SQL snippet button is selected
   */
  saveGeneratedSQL?: (answer: string, title: string) => Promise<void>
}

const CommandMenuProvider = ({
  children,
  site,
  projectRef,
  apiKeys,
  apiUrl,
  metadata,
  isOptedInToAI = false,
  saveGeneratedSQL,
}: PropsWithChildren<CommandMenuProviderProps>) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [pages, setPages] = useState<string[]>([])
  const inputRef = useRef<ElementRef<typeof CommandInput>>(null)
  const currentPage = pages[pages.length - 1]

  const project = projectRef !== undefined ? { ref: projectRef, apiKeys, apiUrl } : undefined

  useKeyboardEvents({ setIsOpen, currentPage, setSearch, setPages })

  return (
    <CommandMenuContext.Provider
      value={{
        isOpen,
        setIsOpen,
        isLoading,
        setIsLoading,
        setSearch,
        search,
        pages,
        setPages,
        currentPage,
        site,
        project,
        metadata,
        isOptedInToAI,
        saveGeneratedSQL,
        inputRef,
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
