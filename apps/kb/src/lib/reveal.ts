import type { CSSProperties } from 'react'

type RevealStyle = CSSProperties & { '--reveal-index': number }

export const REVEAL_GROUP_CLASS = 'group/reveal'

export const REVEAL_ITEM_CLASS = [
  'motion-safe:opacity-0 motion-safe:group-data-[revealed=true]/reveal:opacity-100',
  'motion-safe:group-data-[revealed=true]/reveal:animate-[reveal-up_500ms_cubic-bezier(0.23,1,0.32,1)_calc(min(var(--reveal-index),8)*60ms)_both]',
].join(' ')

export const bindRevealOnce = (element: HTMLElement | null) => {
  if (!element) return
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (!entry?.isIntersecting) return
      element.dataset.revealed = 'true'
      observer.disconnect()
    },
    { rootMargin: '0px 0px -10% 0px' }
  )
  observer.observe(element)
  return () => observer.disconnect()
}

export const revealStyle = (index: number): RevealStyle => ({ '--reveal-index': index })
