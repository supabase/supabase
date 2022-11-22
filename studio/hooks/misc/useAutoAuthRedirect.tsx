import { auth, getNextPath } from 'lib/gotrue'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { useSWRConfig } from 'swr'

function useAutoAuthRedirect() {
  const router = useRouter()
  const { cache } = useSWRConfig()

  useEffect(() => {
    const returnTo = new URLSearchParams(location.search).get('next')

    if (!returnTo) {
      // If there's no returnTo, then we don't need to do anything
      return
    }

    ;(async () => {
      const { error } = await auth.initialize()

      if (error) {
        // if there was a problem signing in via the url, don't redirect
        return
      }

      const {
        data: { session },
      } = await auth.getSession()

      if (session) {
        // .clear() does actually exist on the cache object, but it's not in the types 🤦🏻
        // @ts-ignore
        cache.clear()

        await router.push(getNextPath())
      }
    })()
  }, [])
}

export default useAutoAuthRedirect
