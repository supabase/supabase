import { useRouter } from 'next/router'

const isBrowser = typeof window !== 'undefined'

export function useGoogleAnalyticsProps() {
  const { locale } = useRouter()

  return {
    screenResolution: isBrowser ? `${window.innerWidth}x${window.innerHeight}` : undefined,
    language: locale ?? 'en-US',
  }
}
