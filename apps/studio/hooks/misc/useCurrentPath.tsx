import { useRouter } from 'next/router'

export const useCurrentPath = () => {
  const router = useRouter()

  if (!router.isReady) {
    return ''
  }

  const pathWithQuery = router.asPath
  const currentPath = pathWithQuery.split('?')[0]

  return currentPath
}
