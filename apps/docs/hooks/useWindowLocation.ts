import useIsMounted from './useIsMounted'
import { useEffect, useState } from 'react'

const useWindowLocation = (): Location | void => {
  const isMounted = useIsMounted()
  const [location, setLocation] = useState<Location | void>(isMounted ? window.location : undefined)

  const setWindowLocation = (location) => {
    setLocation(location)
  }

  useEffect(() => {
    if (!isMounted) return

    if (!location) {
      setWindowLocation(window.location)
    }

    const handler = () => {
      setWindowLocation(window.location)
    }

    window.addEventListener('popstate', handler)

    return () => {
      window.removeEventListener('popstate', handler)
    }
  }, [isMounted])

  useEffect(() => {
    // console.log('location, in hook useffect', location)
  }, [location])

  return location
}

export default useWindowLocation
