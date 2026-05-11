import { useCallback, useState } from 'react'

import { getAPIKeysById } from '@/data/api-keys/api-key-id-query'

interface UseRevealedSecretOptions {
  projectRef?: string
  id?: string
}

export function useRevealedSecret({ projectRef, id }: UseRevealedSecretOptions) {
  const [data, setData] = useState<string | undefined | null>()
  const [isLoading, setIsLoading] = useState(false)

  const reveal = useCallback(async () => {
    if (!projectRef || !id) return

    setIsLoading(true)

    try {
      const result = await getAPIKeysById({ projectRef, id, reveal: true })
      setData(result.api_key)
      return result.api_key
    } catch (error) {
      console.error('Failed to reveal secret key:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [projectRef, id])

  const clear = useCallback(() => {
    setData(undefined)
  }, [])

  return { data, isLoading, reveal, clear }
}
