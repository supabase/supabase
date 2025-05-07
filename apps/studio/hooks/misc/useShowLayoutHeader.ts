import { useParams } from 'common'
import { useRouter } from 'next/router'

export function useShowLayoutHeader() {
  const { ref } = useParams()
  const router = useRouter()
  const pathname = router.pathname ?? ''

  const shouldShow =
    pathname.startsWith('/new') ||
    pathname === '/organizations' ||
    pathname === '/sign-in' ||
    Boolean(ref)

  return shouldShow
}
