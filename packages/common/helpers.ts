import { useSyncExternalStore } from 'react'
import type * as React from 'react'

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

export function ensurePlatformSuffix(apiUrl: string) {
  return apiUrl.endsWith('/platform') ? apiUrl : `${apiUrl}/platform`
}

export function mergeRefs<T>(...refs: React.Ref<T>[]): React.RefCallback<T> {
  return (value) => {
    refs.forEach((ref) => {
      if (typeof ref === 'function') {
        ref(value)
      } else if (ref !== null) {
        if (typeof ref === 'object' && ref !== null && 'current' in ref) {
          ;(ref as any).current = value
        }
      }
    })
  }
}
