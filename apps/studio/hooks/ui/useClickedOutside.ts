import { useEffect, useState } from 'react'

/**
 * Hook that alerts clicks outside of the passed ref
 */
export const useClickedOutside = (ref: any) => {
  const [active, setActive] = useState<boolean>(false)

  useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setActive(true)
      } else {
        setActive(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [ref])

  return active
}
