export function cancellableDebounce(fn: (...args: unknown[]) => void, delay?: number) {
  let timeout: ReturnType<typeof setTimeout> | undefined

  return (...args: unknown[]) => {
    if (timeout) {
      clearTimeout(timeout)
    }

    timeout = setTimeout(() => fn(...args), delay)

    return timeout
  }
}
