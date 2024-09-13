import { useSyncExternalStore } from 'react'
import { vi } from 'vitest'

export const detectBrowser = () => {
  if (!navigator) return undefined

  if (navigator.userAgent.indexOf('Chrome') !== -1) {
    return 'Chrome'
  } else if (navigator.userAgent.indexOf('Firefox') !== -1) {
    return 'Firefox'
  } else if (navigator.userAgent.indexOf('Safari') !== -1) {
    return 'Safari'
  }
}

export const isBrowser = typeof window !== 'undefined'

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

const prefersReducedMotionMediaQuery =
  isBrowser && window.matchMedia('(prefers-reduced-motion: reduce)')

/**
 * @returns boolean value If the user has expressed their preference for reduced motion.
 */
export const useReducedMotion = (): boolean => {
  if (!prefersReducedMotionMediaQuery) return false
  return useSyncExternalStore(
    (callback) => {
      prefersReducedMotionMediaQuery.addEventListener('change', callback)
      return () => {
        prefersReducedMotionMediaQuery.removeEventListener('change', callback)
      }
    },
    () => prefersReducedMotionMediaQuery.matches,
    () => false
  )
}
