import { useCallback, useLayoutEffect, useRef } from 'react'

export const useStaticEffectEvent = <Callback extends Function>(callback: Callback) => {
  const callbackRef = useRef(callback)

  useLayoutEffect(() => {
    callbackRef.current = callback
  })

  const eventFn = useCallback((...args: any) => {
    return callbackRef.current(...args)
  }, [])

  return eventFn as unknown as Callback
}
