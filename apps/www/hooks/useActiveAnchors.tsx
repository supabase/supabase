'use client'

import { useEffect, useRef } from 'react'
import { isBrowser, stripEmojis } from '~/lib/helpers'

interface UseActiveAnchorsOptions {
  /** CSS selector for heading elements to track */
  anchorsSelector?: string
  /** CSS selector for TOC anchor links */
  tocSelector?: string
  /** Pixel offset from top of viewport for activation threshold */
  offset?: number
}

/**
 * Hook to handle Table of Contents (TOC) functionality for blog posts.
 *
 * Provides two main features:
 * 1. **TOC highlighting**: Highlights the active TOC link based on scroll position
 *    by adding/removing the `toc-animate` CSS class.
 * 2. **Hash scrolling**: Smoothly scrolls to the target heading when the page
 *    loads with a URL hash (e.g., `/blog/post#section-name`).
 *
 * @param options - Configuration options for the hook
 *
 * @example
 * ```tsx
 * // Basic usage with defaults
 * useActiveAnchors()
 *
 * // Custom selectors and offset
 * useActiveAnchors({
 *   anchorsSelector: 'h2, h3',
 *   tocSelector: '.custom-toc a',
 *   offset: 150
 * })
 * ```
 */
const useActiveAnchors = (options: UseActiveAnchorsOptions = {}): void => {
  const { anchorsSelector = 'h2', tocSelector = '.prose-toc a', offset = 200 } = options

  const anchorsRef = useRef<NodeListOf<HTMLHeadingElement> | null>(null)
  const tocRef = useRef<NodeListOf<HTMLAnchorElement> | null>(null)

  /**
   * Scroll event handler that determines which heading is currently in view
   * and updates the corresponding TOC link with the `toc-animate` class.
   */
  const handleScroll = (): void => {
    const scrollY = window.scrollY
    let newActiveAnchor = ''

    // Find the heading that's currently scrolled past
    anchorsRef.current?.forEach((anchor) => {
      if (scrollY >= anchor.offsetTop - offset) {
        newActiveAnchor = anchor.id
      }
    })

    // Update TOC link styles based on active heading
    tocRef.current?.forEach((link) => {
      link.classList.remove('toc-animate')

      // Normalize both href and heading id for comparison:
      // - Decode URI to handle emojis
      // - Strip emojis and dashes to handle edge cases
      const sanitizedHref = stripEmojis(
        decodeURI(link.getAttribute('href') ?? '').replace('#', '')
      ).replaceAll('-', '')
      const isMatch = sanitizedHref === newActiveAnchor.replaceAll('-', '')

      if (isMatch) {
        link.classList.add('toc-animate')
      }
    })
  }

  /**
   * Handles initial scroll to anchor when page loads with a URL hash.
   * This is necessary because dynamically loaded content may not exist
   * when the browser's native hash scrolling occurs.
   */
  const handleHashScroll = (): void => {
    if (!window.location.hash) return

    const targetId = window.location.hash.slice(1)
    const targetElement = document.getElementById(targetId)

    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth' })
    }
  }

  useEffect(() => {
    if (!isBrowser) return

    // Query and cache heading elements and TOC links
    anchorsRef.current = document.querySelectorAll(anchorsSelector)
    tocRef.current = document.querySelectorAll(tocSelector)

    // Scroll to hash target on initial load
    handleHashScroll()

    // Listen for scroll to update active TOC link
    window.addEventListener('scroll', handleScroll)

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [anchorsSelector, tocSelector, offset])
}

export default useActiveAnchors
