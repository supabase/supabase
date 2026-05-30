import { debounce } from 'lodash-es'

export const safeHistoryReplaceState = debounce((url: string) => {
  if (typeof window === 'undefined') return

  if (url === window.location.href) return

  try {
    window.history.replaceState(null, '', url)
  } catch (error) {
    console.warn('Failed to call history.replaceState:', error)
  }
}, 120)
