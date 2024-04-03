import { useEffect, useReducer } from 'react'

/**
 * An escape hatch to manually trigger component rerenders in response to
 * external events, such as fired custom events.
 */
const useRerenderOnEvt = (event: string, listeningElem?: Document | Window | HTMLElement) => {
  const [, rerender] = useReducer((state) => !state, true)

  useEffect(() => {
    ;(listeningElem ?? window).addEventListener(event, rerender)
    return () => (listeningElem ?? window).removeEventListener(event, rerender)
  }, [event, listeningElem, rerender])
}

export { useRerenderOnEvt }
