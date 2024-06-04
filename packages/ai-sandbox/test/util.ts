import chalk from 'chalk'

/**
 * Prints the provided metadata along with any assertion errors.
 * Works both synchronously and asynchronously.
 *
 * Useful for providing extra context for failed tests.
 */
export function withMetadata<T extends void | Promise<void>>(
  metadata: Record<string, any>,
  fn: () => T
): T {
  /**
   * Prepends metadata to an Error's stack trace.
   */
  function modifyError(err: unknown) {
    if (err instanceof Error && err.stack) {
      const formattedMetadata = Object.entries(metadata).map(([key, value]) => {
        const formattedValue =
          typeof value === 'string' ? value : JSON.stringify(value, undefined, 2)
        return `${chalk.bold.dim(key)}:\n\n${chalk.green.dim(formattedValue)}`
      })
      err.stack = `${formattedMetadata.join('\n\n')}\n\n${err.stack}`
    }

    return err
  }

  // Execute the function and handle both
  // synchronous or asynchronous scenarios
  try {
    const maybePromise = fn()

    if (maybePromise instanceof Promise) {
      return maybePromise.catch((err) => {
        // Re-throw the error
        throw modifyError(err)
      }) as T
    }
    return maybePromise
  } catch (err) {
    // Re-throw the error
    throw modifyError(err)
  }
}
