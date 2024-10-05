import { useSyncExternalStore } from 'react'

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
