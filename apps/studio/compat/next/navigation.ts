import { useLocation, useRouter as useTanStackRouter } from '@tanstack/react-router'

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
