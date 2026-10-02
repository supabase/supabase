export async function waitForEventually<T>(
  getValue: () => Promise<T>,
  predicate: (value: T) => boolean,
  description: string,
  timeoutMs = 5000,
  intervalMs = 25
): Promise<T> {
  const deadline = Date.now() + timeoutMs
  let lastValue: T | undefined

  while (Date.now() <= deadline) {
    lastValue = await getValue()

    if (predicate(lastValue)) {
      return lastValue
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs))
  }

  throw new Error(
    `Timed out after ${timeoutMs}ms waiting for ${description}. Last value: ${JSON.stringify(lastValue)}`
  )
}
