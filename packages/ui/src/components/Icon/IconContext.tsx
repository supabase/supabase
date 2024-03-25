import { createContext } from 'react'

import { SizeVariantProps } from '../../lib/commonCva'

type ContextValue = { contextSize?: SizeVariantProps; className?: string }

// Make sure the shape of the default value passed to
// createContext matches the shape that the consumers expect!
export const IconContext = createContext<ContextValue>({
  contextSize: 'small',
  className: '',
})
