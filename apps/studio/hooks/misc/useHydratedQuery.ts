import { useHydrated } from '@tanstack/react-router'
import { useRouter, type NextRouter } from 'next/router'

/**
 * Query params for use during render. Empty until hydration, since one prerendered file serves
 * every query string and the first client render has to match it.
 */
export function useHydratedQuery(): NextRouter['query'] {
  const router = useRouter()
  return useHydrated() ? router.query : {}
}
