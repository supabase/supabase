import { debounce } from 'lodash-es'

let lastUrl = ''

const debouncedHistoryReplaceState = debounce((url: string) => {
  if (typeof window === 'undefined') return

  if (url === lastUrl) return

  try {
    window.history.replaceState(null, '', url)
    lastUrl = url
  } catch (error) {
    console.warn('Failed to call history.replaceState:', error)
  }
}, 120)

export const safeHistoryReplaceState = (url: string): void => {
  const normalizedUrl = url.toString()
  debouncedHistoryReplaceState(normalizedUrl)
}
