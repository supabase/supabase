import { useCallback, useRef, useState } from 'react'

import { getAPIKeysById } from '@/data/api-keys/api-key-id-query'

interface UseRevealedSecretOptions {
  projectRef?: string
  id?: string
}

export function useRevealedSecret({ projectRef, id }: UseRevealedSecretOptions) {
  const [data, setData] = useState<string | undefined | null>()
  const [isLoading, setIsLoading] = useState(false)
  const requestIdRef = useRef(0)

  const reveal = useCallback(async () => {
    if (!projectRef || !id) return

    const requestId = ++requestIdRef.current
    setIsLoading(true)

    try {
      const result = await getAPIKeysById({ projectRef, id, reveal: true })
      if (requestId !== requestIdRef.current) return
      setData(result.api_key)
      return result.api_key
    } catch (error) {
      if (requestId !== requestIdRef.current) return
      console.error('Failed to reveal secret key:', error)
      throw error
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false)
      }
    }
  }, [projectRef, id])

  const clear = useCallback(() => {
    requestIdRef.current++
    setData(undefined)
  }, [])

  return { data, isLoading, reveal, clear }
}
