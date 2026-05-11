'use client'

import { useEffect } from 'react'
import { isBrowser, stripEmojis } from '~/lib/helpers'

interface UseActiveAnchorsOptions {
  /** CSS selector for heading elements to track */
  anchorsSelector?: string
  /** CSS selector for TOC anchor links */
  tocSelector?: string
  /** rootMargin top offset for when a heading becomes active */
  rootMarginTop?: string
}

const useActiveAnchors = (options: UseActiveAnchorsOptions = {}): void => {
  const {
    anchorsSelector = 'article h2, article h3',
    tocSelector = '.prose-toc a',
    rootMarginTop = '-80px',
  } = options

  useEffect(() => {
    if (!isBrowser) return

    // Handle hash scrolling on initial load
    if (window.location.hash) {
      const targetId = window.location.hash.slice(1)
      const targetElement = document.getElementById(targetId)
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth' })
      }
    }

    // Track which headings have been scrolled past
    const passedHeadings = new Set<string>()
    let activeHeadingId = ''

    const updateToc = () => {
      const tocLinks = document.querySelectorAll<HTMLAnchorElement>(tocSelector)
      if (tocLinks.length === 0) return

      const links = Array.from(tocLinks)
      let activeIndex = -1

      links.forEach((link, i) => {
        const rawHref = link.getAttribute('href') ?? ''
        const sanitizedHref = stripEmojis(
          decodeURI(rawHref).replace('#', '')
        ).replaceAll('-', '')
        const normalizedId = activeHeadingId.replaceAll('-', '')
        if (i === 0) {
          console.log('[TOC Debug] matching example — href:', rawHref, '→ sanitized:', sanitizedHref, 'vs id:', activeHeadingId, '→ normalized:', normalizedId)
        }
        if (sanitizedHref === normalizedId) {
          activeIndex = i
        }
      })

      console.log('[TOC Debug] updateToc → activeHeadingId:', activeHeadingId, 'activeIndex:', activeIndex, 'totalLinks:', links.length)

      links.forEach((link, i) => {
        link.classList.remove('toc-animate', 'toc-passed')

        if (i === activeIndex) {
          link.classList.add('toc-animate')
        } else if (activeIndex >= 0 && i < activeIndex) {
          link.classList.add('toc-passed')
        }
      })
    }

    // Wait a tick for dynamic content to render
    const timer = setTimeout(() => {
      const headings = document.querySelectorAll<HTMLHeadingElement>(anchorsSelector)
      const tocLinks = document.querySelectorAll<HTMLAnchorElement>(tocSelector)

      console.log('[TOC Debug] headings found:', headings.length)
      console.log('[TOC Debug] TOC links found:', tocLinks.length)

      headings.forEach((h) => console.log('[TOC Debug] heading:', h.tagName, h.id, h.textContent?.slice(0, 50)))
      tocLinks.forEach((a) => console.log('[TOC Debug] toc link href:', a.getAttribute('href')))

      if (headings.length === 0) {
        console.log('[TOC Debug] No headings found with selector:', anchorsSelector)
        return
      }

      // Collect all heading IDs in order
      const headingIds = Array.from(headings)
        .map((h) => h.id)
        .filter(Boolean)

      console.log('[TOC Debug] heading IDs:', headingIds)

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const id = entry.target.id
            if (entry.isIntersecting) {
              activeHeadingId = id
              passedHeadings.add(id)
            }
          })

          // Find the last heading that has entered the viewport
          // by checking which ones are above the viewport
          let lastAbove = ''
          for (const id of headingIds) {
            const el = document.getElementById(id)
            if (!el) continue
            const rect = el.getBoundingClientRect()
            if (rect.top < 100) {
              lastAbove = id
            }
          }

          if (lastAbove) {
            activeHeadingId = lastAbove
          }

          updateToc()
        },
        {
          rootMargin: `${rootMarginTop} 0px -70% 0px`,
        }
      )

      headings.forEach((heading) => {
        if (heading.id) observer.observe(heading)
      })

      // Also listen to scroll for more precise tracking
      const handleScroll = () => {
        let lastAbove = ''
        for (const id of headingIds) {
          const el = document.getElementById(id)
          if (!el) continue
          const rect = el.getBoundingClientRect()
          if (rect.top < 100) {
            lastAbove = id
          }
        }

        if (lastAbove !== activeHeadingId) {
          activeHeadingId = lastAbove
          console.log('[TOC Debug] scroll → active:', lastAbove)
          updateToc()
        }
      }

      window.addEventListener('scroll', handleScroll, { passive: true })

      // Store cleanup refs
      ;(cleanupRef as any).observer = observer
      ;(cleanupRef as any).handleScroll = handleScroll
    }, 500)

    const cleanupRef: Record<string, any> = {}

    return () => {
      clearTimeout(timer)
      if (cleanupRef.observer) cleanupRef.observer.disconnect()
      if (cleanupRef.handleScroll) {
        window.removeEventListener('scroll', cleanupRef.handleScroll)
      }
    }
  }, [anchorsSelector, tocSelector, rootMarginTop])
}

export default useActiveAnchors
