export function cancellableDebounce<T>(fn: (...args: T[]) => void | Promise<void>, delay?: number) {
  let timeout: ReturnType<typeof setTimeout> | undefined

  return (...args: T[]) => {
    if (timeout) {
      clearTimeout(timeout)
    }

    timeout = setTimeout(() => fn(...args), delay)

    return timeout
  }
}
