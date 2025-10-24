// get reading time
// returns :string
export const generateReadingTime = (text: string) => {
  const wordsPerMinute = 200
  const noOfWords = text.split(/\s/g).length
  const minutes = noOfWords / wordsPerMinute
  const readTime = Math.ceil(minutes)
  return `${readTime} minute read`
}
// Helps with the TypeScript issue where filtering doesn't narrows undefined nor null types, check https://github.com/microsoft/TypeScript/issues/16069
export function isNotNullOrUndefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined
}

export function capitalize(word: string) {
  return word[0].toUpperCase() + word.substring(1).toLowerCase()
}

export function isMobileOrTablet() {
  // https://stackoverflow.com/a/8876069/114157
  const viewportWidth = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0)
  return viewportWidth < 1200
}

// Convert numbers or strings to pixel value
// Helpful for styled-jsx when using a prop
// height: ${toPixels(height)}; (supports height={20} and height="20px")

export const toPixels = (value: string | number) => {
  if (typeof value === 'number') {
    return `${value}px`
  }

  return value
}

export const isBrowser = typeof window !== 'undefined'

export const stripEmojis = (str: string) =>
  str
    .replace(
      /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
      ''
    )
    .replace(/\s+/g, ' ')
    .trim()

// Vanilla JavaScript implementations to replace lodash functions

/**
 * Creates an array of numbers (positive and/or negative) progressing from start up to, but not including, end.
 * @param start The start of the range
 * @param end The end of the range
 * @param step The value to increment or decrement by
 * @returns Returns the range of numbers
 */
export const range = (start: number, end?: number, step: number = 1): number[] => {
  if (end === undefined) {
    end = start
    start = 0
  }

  const result: number[] = []
  for (let i = start; step > 0 ? i < end : i > end; i += step) {
    result.push(i)
  }
  return result
}

/**
 * Converts string to start case.
 * @param string The string to convert
 * @returns Returns the start cased string
 */
export const startCase = (string: string): string => {
  if (!string) return string

  return string
    .replace(/[-_\s]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim()
}

/**
 * Creates a debounced function that delays invoking func until after wait milliseconds have elapsed since the last time the debounced function was invoked.
 * @param func The function to debounce
 * @param wait The number of milliseconds to delay
 * @param options The options object
 * @returns Returns the new debounced function
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  options: { leading?: boolean; trailing?: boolean } = {}
): ((...args: Parameters<T>) => void) & {
  cancel: () => void
  flush: () => void | undefined
  pending: () => boolean
} => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  let lastCallTime: number | undefined
  let lastInvokeTime = 0

  const { leading = false, trailing = true } = options

  function invokeFunc(time: number, ...args: Parameters<T>) {
    lastInvokeTime = time
    func.apply(null, args)
  }

  function startTimer(pendingFunc: () => void, wait: number) {
    return setTimeout(pendingFunc, wait)
  }

  function cancelTimer(id: ReturnType<typeof setTimeout>) {
    clearTimeout(id)
  }

  function leadingEdge(time: number, ...args: Parameters<T>) {
    lastInvokeTime = time
    timeoutId = startTimer(timerExpired, wait)
    return leading ? invokeFunc(time, ...args) : undefined
  }

  function remainingWait(time: number) {
    const timeSinceLastCall = time - (lastCallTime || 0)
    const timeSinceLastInvoke = time - lastInvokeTime
    const timeWaiting = wait - timeSinceLastCall

    return Math.min(timeWaiting, wait - timeSinceLastInvoke)
  }

  function shouldInvoke(time: number) {
    const timeSinceLastCall = time - (lastCallTime || 0)
    const timeSinceLastInvoke = time - lastInvokeTime

    return (
      lastCallTime === undefined ||
      timeSinceLastCall >= wait ||
      timeSinceLastCall < 0 ||
      timeSinceLastInvoke >= wait
    )
  }

  function timerExpired() {
    const time = Date.now()
    if (shouldInvoke(time)) {
      return trailingEdge(time)
    }
    timeoutId = startTimer(timerExpired, remainingWait(time))
  }

  function trailingEdge(time: number) {
    timeoutId = undefined

    if (trailing) {
      // For trailing edge, we don't have the original arguments, so we call without them
      return invokeFunc(time, ...([] as any))
    }
  }

  function cancel() {
    if (timeoutId !== undefined) {
      cancelTimer(timeoutId)
    }
    lastInvokeTime = 0
    lastCallTime = undefined
    timeoutId = undefined
  }

  function flush() {
    return timeoutId === undefined ? undefined : trailingEdge(Date.now())
  }

  function pending() {
    return timeoutId !== undefined
  }

  function debounced(this: any, ...args: Parameters<T>) {
    const time = Date.now()
    const isInvoking = shouldInvoke(time)

    lastCallTime = time

    if (isInvoking) {
      if (timeoutId === undefined) {
        return leadingEdge(lastCallTime, ...args)
      }
      if (trailing) {
        timeoutId = startTimer(timerExpired, wait)
        return invokeFunc(lastCallTime, ...args)
      }
    }
    if (timeoutId === undefined) {
      timeoutId = startTimer(timerExpired, wait)
    }
  }

  debounced.cancel = cancel
  debounced.flush = flush
  debounced.pending = pending

  return debounced
}
