import { createContext } from 'react'

// Make sure the shape of the default value passed to
// createContext matches the shape that the consumers expect!
export const DropdownContext = createContext({
  onClick: (e: any) => {},
})
