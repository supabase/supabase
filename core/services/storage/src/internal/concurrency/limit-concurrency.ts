type QueuedTask = () => Promise<void>

export function createConcurrencyLimiter(maxConcurrency: number) {
  if (!Number.isInteger(maxConcurrency) || maxConcurrency < 1) {
    throw new Error(`Concurrency limit must be a positive integer, received ${maxConcurrency}`)
  }

  const queue: QueuedTask[] = []
  let active = 0

  const drain = () => {
    while (active < maxConcurrency) {
      const task = queue.shift()

      if (!task) {
        return
      }

      active++
      queueMicrotask(() => void task())
    }
  }

  return <T>(fn: () => Promise<T>) => {
    return new Promise<T>((resolve, reject) => {
      queue.push(async () => {
        try {
          resolve(await fn())
        } catch (e) {
          reject(e)
        } finally {
          active--
          drain()
        }
      })

      drain()
    })
  }
}
