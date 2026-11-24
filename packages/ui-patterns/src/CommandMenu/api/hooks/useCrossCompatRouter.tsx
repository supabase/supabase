'use client'

import { useFramework } from 'common'
import { useMemo } from 'react'

import { useResetCommandMenu, useSetCommandMenuOpen } from './viewHooks'

export function useCrossCompatRouter() {
  const { push } = useFramework()
  const setIsOpen = useSetCommandMenuOpen()
  const resetCommandMenu = useResetCommandMenu()

  return useMemo(
    () => ({
      push: (path: string) => {
        // Close once the push settles rather than on an `asPath` change alone, so pushes that
        // leave `asPath` unchanged (same URL, or search params in Next App Router) still close.
        new Promise((resolve) => resolve(push(path)))
          .catch((error) => console.error('Failed to navigate:', error))
          .finally(() => {
            setIsOpen(false)
            resetCommandMenu()
          })
      },
    }),
    [push, resetCommandMenu, setIsOpen]
  )
}
