'use client'

import { createContext } from 'react'

import defaultTheme from '../../lib/theme/defaultTheme'

// import useDarkMode from './utils/useDarkMode'

interface ThemeContextInterface {
  theme?: any
  // mode?: 'light' | 'dark'
  // toggleMode?: any
}

export const ThemeContext = createContext<ThemeContextInterface>({
  theme: defaultTheme,
  // mode: 'light',
  // toggleMode: true,
})
