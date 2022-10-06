import { createContext } from 'react'

// Make sure the shape of the default value passed to
// createContext matches the shape that the consumers expect!
export const SelectContext = createContext({
  onChange: (e: any) => {},
  selected: undefined,
})
