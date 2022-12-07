import useIsMounted from './useIsMounted'
import { useEffect, useState } from 'react'

const useWindowLocation = (): Location | void => {
  const isMounted = useIsMounted()
  const [location, setLocation] = useState<Location | void>(isMounted ? window.location : undefined)

  const setWindowLocation = (location) => {
    setLocation(location)
  }

  useEffect(() => {
    console.log('HOOK USEEFFECT FOR WINDOWWW')
    if (!isMounted) return
    console.log('I AM MOUNTED')

    if (!location) {
      setWindowLocation(window.location)
    }

    const handler = () => {
      console.log('handlinggg...')
      console.log(window.location)
      setWindowLocation(window.location)
    }

    window.addEventListener('popstate', handler)

    return () => {
      window.removeEventListener('popstate', handler)
    }
  }, [isMounted])

  useEffect(() => {
    console.log('location, in hook useffect', location)
  }, [location])

  return location
}

// const useWindowLocation = (): any => {
//   const [location, setLocation] = useState((window && window.location) ?? undefined)
//   const setWindowLocation = () => {
//     console.log('Hello', window.location)
//     setLocation(window.location)
//   }
//   useEffect(() => {
//     window.addEventListener('popstate', setWindowLocation)
//     return () => {
//       window.removeEventListener('popstate', setWindowLocation)
//     }
//   }, [])
//   return location
// }
export default useWindowLocation
