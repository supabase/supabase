import { SizeVariantProps } from '@ui/lib/commonCva'
import { createContext } from 'react'

type ContextValue = { contextSize?: SizeVariantProps; className?: string }

// Make sure the shape of the default value passed to
// createContext matches the shape that the consumers expect!
export const IconContext = createContext<ContextValue>({
  contextSize: 'small',
  className: '',
})
