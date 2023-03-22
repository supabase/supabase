import {
  createContext,
  FC,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import SearchModal from './SearchModal'

export type SearchContextValue = {
  isOpen: boolean
  open: () => void
  close: () => void
  query: string
  setQuery: (query: string) => void
}

export const SearchContext = createContext<SearchContextValue>(null)

export const useSearch = () => {
  const { isOpen, open, close, query, setQuery } = useContext(SearchContext)

  return { isOpen, open, close, query, setQuery }
}

const SearchProvider: FC<PropsWithChildren<{}>> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')

  const open = useCallback(() => {
    setIsOpen(true)
    document.body.classList.add('DocSearch--active')
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
    document.body.classList.remove('DocSearch--active')
  }, [])

  useSearchKeyboardEvents({
    open,
    close,
  })

  return (
    <SearchContext.Provider value={{ isOpen, open, close, query, setQuery }}>
      {children}
      {isOpen && createPortal(<SearchModal />, document.body)}
    </SearchContext.Provider>
  )
}

function useSearchKeyboardEvents({ open, close }) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      switch (event.key) {
        case 'Escape':
          close()
          return
        case 'k':
        case '/':
          if (event.metaKey || event.ctrlKey) {
            open()
          }
          return
      }
    }

    window.addEventListener('keydown', onKeyDown)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, close])
}

export default SearchProvider
