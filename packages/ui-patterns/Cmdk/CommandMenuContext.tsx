'use client'
import { createContext, useContext } from 'react'

export interface CommandMenuContextValue {
  isOpen: boolean
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
  isLoading: boolean
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>
  search: string
  setSearch: React.Dispatch<React.SetStateAction<string>>
  pages: string[]
  setPages: React.Dispatch<React.SetStateAction<string[]>>
  currentPage?: string
  inputRef: React.RefObject<HTMLInputElement>
  site: 'studio' | 'docs' | 'website'

  /**
   * Project metadata for easy retrieval
   */
  project?: { ref?: string; apiKeys?: { anon?: string; service?: string }; apiUrl?: string }
  /**
   * Any additional metadata that CMDK component can use in its AI prompts
   */
  metadata?: { definitions?: string; flags?: { [key: string]: string } }
  /**
   * Opt in flag to use additional metadata in AI prompts
   */
  isOptedInToAI: boolean

  // Optional callback to save a generated SQL output
  saveGeneratedSQL?: (answer: string, title: string) => Promise<void>
}

export const CommandMenuContext = createContext<CommandMenuContextValue | undefined>(undefined)
export const useCommandMenu = () => {
  const context = useContext(CommandMenuContext)

  if (context === undefined) {
    throw new Error('useCommandMenu was used outside of CommandMenuProvider')
  }

  return context
}
