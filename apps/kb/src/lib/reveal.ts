import type { CSSProperties } from 'react'

type RevealStyle = CSSProperties & { '--reveal-index': number }

// roughly when the hero copy starts fading in
const ON_LOAD_OFFSET_MS = 300

export const REVEAL_GROUP_CLASS = 'group/reveal'

export const REVEAL_ITEM_CLASS = [
  'motion-safe:opacity-0 motion-safe:group-data-revealed/reveal:opacity-100',
  'motion-safe:group-data-[revealed=true]/reveal:animate-[reveal-up_500ms_var(--ease-out-strong)_calc(var(--reveal-offset,0ms)_+_min(var(--reveal-index),8)*60ms)_both]',
].join(' ')

// fade only, no translate: the hero canvases measure the copy while it reveals
export const REVEAL_FADE_ITEM_CLASS = [
  'motion-safe:opacity-0 motion-safe:group-data-revealed/reveal:opacity-100',
  'motion-safe:group-data-[revealed=true]/reveal:animate-[reveal-fade_450ms_ease-out_calc(180ms_+_var(--reveal-index)*70ms)_both]',
].join(' ')

export const bindRevealOnce = (element: HTMLElement | null) => {
  if (!element) return
  // the last item has the longest delay, so its end means the whole stagger is done
  const settle = (event: Event) => {
    if (event.target !== element.lastElementChild) return
    element.dataset.revealed = 'settled'
  }
  element.addEventListener('animationend', settle)
  element.addEventListener('animationcancel', settle)
  let isFirstCheck = true
  const observer = new IntersectionObserver(
    ([entry]) => {
      const isOnScreenAtLoad = isFirstCheck
      isFirstCheck = false
      if (!entry?.isIntersecting) return
      // groups already in view on load wait for the hero instead of beating it in
      if (isOnScreenAtLoad) element.style.setProperty('--reveal-offset', `${ON_LOAD_OFFSET_MS}ms`)
      element.dataset.revealed = 'true'
      observer.disconnect()
    },
    { rootMargin: '0px 0px -10% 0px' }
  )
  observer.observe(element)
  return () => {
    observer.disconnect()
    element.removeEventListener('animationend', settle)
    element.removeEventListener('animationcancel', settle)
  }
}

export const revealStyle = (index: number): RevealStyle => ({ '--reveal-index': index })
