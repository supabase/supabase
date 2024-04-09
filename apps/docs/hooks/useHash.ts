import { useState, useCallback, useEffect } from 'react'

const useHash = () => {
  const [hash, setHash] = useState(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      return url.hash.substring(1) // Removes the leading '#'
    }
    return undefined
  })

  const hashChangeHandler = useCallback(() => {
    const url = new URL(window.location.href)
    setHash(url.hash.substring(1))
  }, [])

  useEffect(() => {
    window.addEventListener('hashchange', hashChangeHandler)
    return () => {
      window.removeEventListener('hashchange', hashChangeHandler)
    }
  }, [hashChangeHandler])

  const updateHash = useCallback(
    (newHash) => {
      if (newHash !== hash) {
        window.location.hash = newHash
      }
    },
    [hash]
  )

  return [hash, updateHash] as const
}

export default useHash
