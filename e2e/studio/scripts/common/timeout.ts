export default async function timeoutRequest<T>(
  request: Promise<T>,
  timeout: number,
  abortController?: AbortController
): Promise<T> {
  let timer: NodeJS.Timeout | undefined
  const cleanup = () => {
    if (timer) {
      clearTimeout(timer)
      timer = undefined
    }
  }

  try {
    const timeoutPromise = new Promise<T>((_, reject) => {
      timer = setTimeout(() => {
        if (abortController) {
          abortController.abort()
        }
        cleanup()
        reject(new Error(`Timeout (${timeout}) for task exceeded`))
      }, timeout)
    })

    const result = await Promise.race<T>([
      request.catch((err) => {
        cleanup()
        throw err
      }),
      timeoutPromise
    ])

    cleanup()
    return result

  } catch (error) {
    cleanup()
    throw error
  }
}
