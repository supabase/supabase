import { useRouter } from 'next/router'

const useGoogleAnalyticsProps = () => {
  const { locale } = useRouter()

  return {
    screenResolution:
      typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : undefined,
    language: locale ?? 'en-US',
  }
}

export default useGoogleAnalyticsProps
