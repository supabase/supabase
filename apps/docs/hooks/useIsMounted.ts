import { useEffect, useState } from 'react'

const useIsMounted = (): boolean => {
  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => {
    setIsMounted(() => true)
  }, [])

  return isMounted
}

export default useIsMounted
