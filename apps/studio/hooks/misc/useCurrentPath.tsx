import { useRouter, usePathname } from 'next/navigation'

export const useCurrentPath = () => {
  const router = useRouter()
  const pathname = usePathname()

  // if (!router.isReady) {
  //   return ''
  // }

  return pathname

  const pathWithQuery = pathname

  const currentPath = pathWithQuery.split('?')[0]

  return currentPath
}
