import { useReducedMotion } from 'motion/react'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

import { useMainScrollContainer } from '@/components/layouts/MainScrollContainerContext'

const SCROLL_TIMEOUT_MS = 5000

export const useScrollToHash = () => {
  const router = useRouter()
  const mainScrollContainer = useMainScrollContainer()
  const shouldReduceMotion = useReducedMotion()
  const hash = router.asPath.split('#')[1] ?? ''

  useEffect(() => {
    if (!hash) return

    const behavior = shouldReduceMotion ? 'auto' : 'smooth'

    const scrollToElement = (element: HTMLElement) => {
      if (!mainScrollContainer) {
        element.scrollIntoView({ behavior, block: 'start' })
        return
      }

      const scrollMarginTop = Number.parseFloat(getComputedStyle(element).scrollMarginTop) || 0
      const top =
        mainScrollContainer.scrollTop +
        element.getBoundingClientRect().top -
        mainScrollContainer.getBoundingClientRect().top -
        scrollMarginTop

      mainScrollContainer.scrollTo({ top: Math.max(0, top), behavior })
    }

    const tryScroll = () => {
      const element = document.getElementById(hash)
      if (element) scrollToElement(element)
      return !!element
    }

    if (tryScroll()) return

    const observer = new MutationObserver(() => {
      if (tryScroll()) observer.disconnect()
    })
    observer.observe(mainScrollContainer ?? document.body, { childList: true, subtree: true })

    const timeout = setTimeout(() => observer.disconnect(), SCROLL_TIMEOUT_MS)

    return () => {
      observer.disconnect()
      clearTimeout(timeout)
    }
  }, [hash, mainScrollContainer, shouldReduceMotion])
}
