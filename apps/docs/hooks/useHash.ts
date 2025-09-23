import { useState, useCallback, useEffect } from 'react'

const useHash = () => {
  const [hash, setHash] = useState(() =>
    typeof window !== 'undefined' ? window.location.hash.split('#')[1] : undefined
  )

  const hashChangeHandler = useCallback(() => {
    setHash(window.location.hash.split('#')[1])
  }, [])

  useEffect(() => {
    window.addEventListener('hashchange', hashChangeHandler)
    return () => {
      window.removeEventListener('hashchange', hashChangeHandler)
    }
  }, [hashChangeHandler])

  const updateHash = useCallback(
    (newHash) => {
      if (newHash !== hash) window.location.hash = newHash
    },
    [hash]
  )

  return [hash, updateHash] as const
}

export default useHash
