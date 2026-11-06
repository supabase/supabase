import { useCallback, useRef, useState } from 'react'

import { getAPIKeysById } from '@/data/api-keys/api-key-id-query'
import { useGrant } from '@/lib/grants'

interface UseRevealedSecretOptions {
  projectRef?: string
  id?: string
}

export function useRevealedSecret({ projectRef, id }: UseRevealedSecretOptions) {
  const [data, setData] = useState<string | undefined | null>()
  const [isLoading, setIsLoading] = useState(false)
  const requestIdRef = useRef(0)

  const revealGrant = useGrant(
    'GET /v1/projects/{ref}/api-keys/{id}',
    { projectRef },
    { variant: 'reveal' }
  )
  const grant = revealGrant.grant

  const reveal = useCallback(async () => {
    if (!projectRef || !id || !grant) return

    const requestId = ++requestIdRef.current
    setIsLoading(true)

    try {
      const result = await getAPIKeysById({ projectRef, id, grant })
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
  }, [projectRef, id, grant])

  const clear = useCallback(() => {
    requestIdRef.current++
    setData(undefined)
  }, [])

  /** Result of the reveal grant, for rendering denied and error states. `reveal()` does nothing unless granted. */
  return { data, isLoading, reveal, clear, revealGrant }
}
