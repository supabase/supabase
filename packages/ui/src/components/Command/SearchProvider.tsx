import React, {
  createContext,
  FC,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import { AiCommand } from './AiCommand'

export type SearchContextValue = {
  query: string
  setQuery: (query: string) => void
}

const SearchProvider: FC<PropsWithChildren<{}>> = ({ children }) => {
  const [query, setQuery] = useState('')

  // useSearchKeyboardEvents({
  //   open,
  //   close,
  // })

  return <AiCommand query={query} setQuery={setQuery} />
}

// function useSearchKeyboardEvents({ open, close }) {
//   useEffect(() => {
//     function onKeyDown(event: KeyboardEvent) {
//       switch (event.key) {
//         case 'Escape':
//           close()
//           return
//         case 'k':
//         case '/':
//           if (event.metaKey || event.ctrlKey) {
//             open()
//           }
//           return
//       }
//     }

//     window.addEventListener('keydown', onKeyDown)

//     return () => {
//       window.removeEventListener('keydown', onKeyDown)
//     }
//   }, [open, close])
// }

export { SearchProvider }
