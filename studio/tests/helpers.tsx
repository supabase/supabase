import { screen, getByText, fireEvent } from '@testing-library/react'
import React from 'react'
import { SWRConfig } from 'swr'
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
 * Wraps a component with a test SWR config, to reset the cache between tests.
 */
export const wrapWithSwrTestConfig = (Component: React.FC<unknown>) => (props: any) =>
  (
    <SWRConfig
      value={{
        provider: () => new Map(),
        shouldRetryOnError: false,
      }}
    >
      <Component {...props} />
    </SWRConfig>
  )
