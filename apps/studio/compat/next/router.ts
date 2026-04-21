import { useLocation, useRouter as useTanStackRouter } from '@tanstack/react-router'

export function useRouter() {
  const router = useTanStackRouter()
  const location = useLocation()
  return {
    pathname: location.pathname,
    basePath: router.basepath ?? '',
  }
}
