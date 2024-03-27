import { useRef } from 'react'

/**
 * Runs the provided callback function once and returns the result.
 *
 * Only the first defined value provided as a callback is run, and subsequent
 * arguments are discarded. Thus the callback does not need to be memoized.
 */
const useRunOnce = <Args extends Array<unknown>, Return>(
  cb: ((...args: Args) => Return) | undefined,
  ...args: Args
) => {
  const alreadyRun = useRef(false)
  const result = useRef<Return>()

  if (!alreadyRun.current && cb) {
    result.current = cb(...args)
    alreadyRun.current = true
  }

  return result.current
}

export { useRunOnce }
