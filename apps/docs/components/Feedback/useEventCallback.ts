'use client'

import { useCallback, useLayoutEffect, useRef } from 'react'

export const useEventCallback = <Args extends unknown[], Result>(
  callback: (...args: Args) => Result
): ((...args: Args) => Result) => {
  const callbackRef = useRef(callback)

  useLayoutEffect(() => {
    callbackRef.current = callback
  })

  return useCallback((...args: Args) => callbackRef.current(...args), [])
}
