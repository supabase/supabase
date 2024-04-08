import { useEffect, useReducer } from 'react'

/**
 * An escape hatch to manually trigger component rerenders in response to
 * external events, such as fired custom events.
 */
const useRerenderOnEvt = (event: string, listeningElem?: Document | Window | HTMLElement) => {
  const [, rerender] = useReducer((state) => !state, true)

  const elem = listeningElem ?? window

  useEffect(() => {
    elem.addEventListener(event, rerender)
    return () => elem.removeEventListener(event, rerender)
  }, [elem, event, rerender])
}

export { useRerenderOnEvt }
