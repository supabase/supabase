import { useParams } from 'common'
import { useNewLayout } from 'hooks/ui/useNewLayout'
import { useRouter } from 'next/router'
export function useShowLayoutHeader() {
  const newLayoutPreview = useNewLayout()
  const { ref } = useParams()
  const router = useRouter()
  const pathname = router.pathname ?? ''

  const shouldShow =
    pathname.startsWith('/new') ||
    pathname === '/organizations' ||
    pathname === '/sign-in' ||
    newLayoutPreview ||
    Boolean(ref)

  console.log('shouldShow', shouldShow)

  return shouldShow
}
