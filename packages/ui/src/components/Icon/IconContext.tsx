import { createContext } from 'react'

type ContextValue = { contextSize?: string; className?: string }

// Make sure the shape of the default value passed to
// createContext matches the shape that the consumers expect!
export const IconContext = createContext<ContextValue>({
  contextSize: '',
  className: '',
})
