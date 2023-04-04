import { screen, getByText, fireEvent } from '@testing-library/react'
import React, { useState } from 'react'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render as originalRender } from '@testing-library/react'
import { RootStore } from 'stores'
import { StoreProvider } from 'hooks'
import { TooltipProvider } from '@radix-ui/react-tooltip'
interface SelectorOptions {
  container?: HTMLElement
}

/**
 * Returns the toggle button given a text matcher
 *
 * Defaults to screen if container option is not provided
 */
export const getToggleByText = (
  text: string | RegExp,
  options: SelectorOptions = {}
): HTMLElement | null => {
  const container = options?.container
  let textNode
  if (container) {
    textNode = getByText(container as HTMLElement, text)
  } else {
    textNode = screen.getByText(text)
  }
  if (textNode && textNode.parentElement) {
    return textNode.parentElement.querySelector('button')
  } else {
    return textNode
  }
}

export const clickDropdown = (elem: HTMLElement) => {
  fireEvent.pointerDown(
    elem,
    new window.PointerEvent('pointerdown', {
      ctrlKey: false,
      button: 0,
    })
  )
}

/**
 * A custom render function for react testing library
 * https://testing-library.com/docs/react-testing-library/setup/#custom-render
 */
const ReactQueryTestConfig: React.FC = ({ children }) => {
  const [rootStore] = useState(() => new RootStore())

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
        logger: {
          log: console.log,
          warn: console.warn,
          // ✅ no more errors on the console for tests
          error: process.env.NODE_ENV === 'test' ? () => {} : console.error,
        },
      })
  )

  return (
    <StoreProvider rootStore={rootStore}>
      <TooltipProvider>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </TooltipProvider>
    </StoreProvider>
  )
}
type renderParams = Parameters<typeof originalRender>
export const render = ((ui: renderParams[0], options: renderParams[1]) =>
  originalRender(ui, { wrapper: ReactQueryTestConfig, ...options })) as typeof originalRender
