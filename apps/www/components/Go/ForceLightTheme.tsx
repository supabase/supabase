'use client'

import { useEffect } from 'react'

// Runs before first paint (during HTML parsing) so the page never flashes dark.
const SET_LIGHT_SCRIPT = `document.documentElement.setAttribute('data-theme','light');document.documentElement.style.colorScheme='light';`

/**
 * Forces the light theme on <html> while the page is mounted, without touching the
 * visitor's saved theme preference. The semantic color tokens are derived at `:root`,
 * so a wrapper class can't switch them; the attribute has to be on the root element.
 */
export function ForceLightTheme() {
  useEffect(() => {
    const root = document.documentElement
    const previousTheme = root.getAttribute('data-theme')
    const previousScheme = root.style.colorScheme

    const apply = () => {
      if (root.getAttribute('data-theme') !== 'light') root.setAttribute('data-theme', 'light')
      root.style.colorScheme = 'light'
    }
    apply()

    // next-themes re-applies the saved theme after hydration; keep light while mounted.
    const observer = new MutationObserver(apply)
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] })

    return () => {
      observer.disconnect()
      if (previousTheme) root.setAttribute('data-theme', previousTheme)
      else root.removeAttribute('data-theme')
      root.style.colorScheme = previousScheme
    }
  }, [])

  return <script dangerouslySetInnerHTML={{ __html: SET_LIGHT_SCRIPT }} />
}
