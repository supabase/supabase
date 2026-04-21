import { useLocation, useRouter as useTanStackRouter } from '@tanstack/react-router'
import { useMemo } from 'react'

export function usePathname() {
  return useLocation().pathname
}

export function useRouter() {
  const router = useTanStackRouter()
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    push: (path: string) => router.navigate({ to: path as any }),
  }
}

export function useSearchParams() {
  const location = useLocation()
  return useMemo(() => new URLSearchParams(location.searchStr ?? ''), [location.searchStr])
}
