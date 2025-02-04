import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { LOCAL_STORAGE_KEYS } from './constants'

export function useIsEmbedded() {
  const router = useRouter()

  const isEmbeddedQueryParam = router.query._embed === '' || Boolean(router.query._embed)

  const [isEmbedded, setIsEmbedded] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.EMBEDDED_MODE,
    isEmbeddedQueryParam
  )

  useEffect(() => {
    if (!isEmbedded && isEmbeddedQueryParam) {
      setIsEmbedded(isEmbeddedQueryParam)
    }
  }, [isEmbedded, isEmbeddedQueryParam, setIsEmbedded])

  return isEmbedded
}
