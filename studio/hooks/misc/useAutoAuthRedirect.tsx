import { auth, getReturnToPath } from 'lib/gotrue'
import { useRouter } from 'next/router'
import { useCallback, useEffect } from 'react'
import { useSWRConfig } from 'swr'

export function usePushNext() {
  const router = useRouter()

  return useCallback(
    async () => {
      const searchParams = new URLSearchParams(location.search)

      const hasNext = searchParams.has('next')

      // preference the next param, as it's used for integration redirects
      if (hasNext) {
        const next = searchParams.get('next')!

        // vercel integration
        const isVercelIntegration = next.includes('https://vercel.com')
        if (isVercelIntegration) {
          searchParams.delete('returnTo')

          return await router.push(`/vercel/integrate?${searchParams.toString()}`)
        }

        // database.new integration
        if (next === 'new-project') {
          searchParams.delete('next')
          searchParams.delete('returnTo')
          const remainingSearchParams = searchParams.toString()

          return await router.push(
            '/new/new-project' + (remainingSearchParams ? `?${remainingSearchParams}` : '')
          )
        }

        return await router.push(
          next + (searchParams.toString() ? `?${searchParams.toString()}` : '')
        )
      }

      return await router.push(getReturnToPath())
    },
    // watch params so router.query will get updated
    [router.query]
  )
}

function useAutoAuthRedirect() {
  const pushNext = usePushNext()
  const { cache } = useSWRConfig()

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    const hasReturnTo = searchParams.has('returnTo')
    const hasNext = searchParams.has('next')
    const shouldRedirect = hasReturnTo || hasNext

    if (!shouldRedirect) {
      // If there's no returnTo or next, then we don't need to do anything
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

        await pushNext()
      }
    })()
  }, [])
}

export default useAutoAuthRedirect
