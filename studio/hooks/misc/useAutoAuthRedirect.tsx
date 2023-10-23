import { QueryClient } from '@tanstack/react-query'
import { auth, getAccessToken, getReturnToPath } from 'lib/gotrue'
import { useRouter } from 'next/router'
import { useCallback, useEffect } from 'react'

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
          return
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

function useAutoAuthRedirect(queryClient: QueryClient) {
  const pushNext = usePushNext()

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    const hasReturnTo = searchParams.has('returnTo')
    const hasNext = searchParams.has('next')
    const shouldRedirect = hasReturnTo || hasNext

    if (!shouldRedirect) {
      // If there's no returnTo or next, then we don't need to do anything
      return
    }

    auth
      .initialize()
      .then(async ({ error }) => {
        if (error) {
          // if there was a problem signing in via the url, don't redirect
          return
        }

        const token = await getAccessToken()

        if (token) {
          const { data, error } = await auth.mfa.getAuthenticatorAssuranceLevel()
          if (error) {
            // if there was a problem fetching the user AAL levels, don't redirect
            return
          }

          // if the user doesn't have the appropriate AAL level, don't redirect
          if (data.currentLevel !== data.nextLevel) {
            return
          }

          await queryClient.resetQueries()
          await pushNext()
        }
      })
      .catch(() => {}) // catch all errors thrown by auth methods
  }, [])
}

export default useAutoAuthRedirect
