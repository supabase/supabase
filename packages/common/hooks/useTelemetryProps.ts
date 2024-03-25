import { useRouter } from 'next/router'
import { isBrowser } from '../helpers'

export function useTelemetryProps() {
  const { locale } = useRouter()

  return {
    screenResolution: isBrowser ? `${window.innerWidth}x${window.innerHeight}` : undefined,
    language: locale ?? 'en-US',
  }
}
