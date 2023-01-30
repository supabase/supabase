import { useEffect } from 'react'
import { useRouter } from 'next/router'

/**
 * If `paramName` exists in query string, then call `setEmail()` with the value
 * and delete it from the URL.
 */
export default function useEmailQueryParam(
  paramName: string,
  setEmail: (email: string) => unknown
) {
  const router = useRouter()
  useEffect(() => {
    if ('URLSearchParams' in window) {
      const { search, pathname } = window.location
      const params = new URLSearchParams(search)
      const email = params.get(paramName)
      if (email) {
        setEmail(email)
        params.delete(paramName)
        const newSearch = params.toString()
        const newAsPath = pathname + (newSearch ? `?${newSearch}` : '')
        const newPathname = router.pathname + (newSearch ? `?${newSearch}` : '')
        history.replaceState(
          { url: newPathname, as: newAsPath, options: { shallow: true } },
          '',
          newAsPath
        )
      }
    }
  }, [setEmail, router.pathname, paramName])
}
