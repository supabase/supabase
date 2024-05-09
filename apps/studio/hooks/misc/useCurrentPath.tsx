import { useRouter } from 'next/router'

type UseCurrentPathOptions = {
  withQuery: boolean
}
export const useCurrentPath = (options?: UseCurrentPathOptions) => {
  const router = useRouter()

  if (!router.isReady) {
    return ''
  }

  const pathWithQuery = router.asPath
  const currentPath = pathWithQuery.split('?')[0]

  return currentPath
}
