const createHistoryRateLimiter = () => {
  const calls: number[] = []
  const MAX_CALLS = 50 
  const TIME_WINDOW = 10000 
  let lastUrl = '' 

  return {
    canCall: (url: string): boolean => {
      const now = Date.now()
      
      while (calls.length > 0 && calls[0] < now - TIME_WINDOW) {
        calls.shift()
      }
      
      if (url === lastUrl) {
        return false
      }
      
      return calls.length < MAX_CALLS
    },
    recordCall: (url: string): void => {
      calls.push(Date.now())
      lastUrl = url
    }
  }
}

const historyRateLimiter = createHistoryRateLimiter()

export const safeHistoryReplaceState = (url: string): boolean => {
  if (typeof window === 'undefined') return false
  
  const normalizedUrl = url.toString()
  
  if (historyRateLimiter.canCall(normalizedUrl)) {
    try {
      window.history.replaceState(null, '', normalizedUrl)
      historyRateLimiter.recordCall(normalizedUrl)
      return true
    } catch (error) {
      // If we hit the browser limit, let log the error here but we're not crashing
      console.warn('Failed to call history.replaceState:', error)
      return false
    }
  }
  
  return false
}
