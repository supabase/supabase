import React, { useLayoutEffect, useMemo } from 'react'
import { createContext } from 'react'

import defaultTheme from '../../lib/theme/defaultTheme'

import { mergeDeep } from '../../utils/mergeDeep'

interface ThemeContextInterface {
  theme?: any
}

export const ThemeContext = createContext<ThemeContextInterface>({
  theme: defaultTheme,
})

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  /**
   * Defines the styles used throughout the library
   */
  theme?: object
}

const ThemeProvider: React.FC<Props> = ({ children, theme: customTheme }) => {
  const mergedTheme = mergeDeep(defaultTheme, customTheme)
  const value = useMemo(
    () => ({
      theme: mergedTheme,
    }),
    []
  )
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export default ThemeProvider
