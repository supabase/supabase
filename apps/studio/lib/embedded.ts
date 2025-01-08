import { useRouter } from 'next/router'

export function useIsEmbedded() {
  const router = useRouter()

  return router.query.embed === '' || Boolean(router.query.embed)
}
