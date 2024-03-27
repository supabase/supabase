import { useRef } from 'react'

const useRunOnce = <Args extends Array<unknown>, Return>(
  cb: (...args: Args) => Return,
  ...args: Args
) => {
  const alreadyRun = useRef(false)
  const result = useRef<Return>()

  if (!alreadyRun.current) {
    result.current = cb(...args)
    alreadyRun.current = true
  }

  return result.current
}

export { useRunOnce }
