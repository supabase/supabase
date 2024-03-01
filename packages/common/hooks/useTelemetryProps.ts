import { isBrowser } from '../helpers'

export function useTelemetryProps() {
  return {
    screenResolution: isBrowser ? `${window.innerWidth}x${window.innerHeight}` : undefined,
    language: 'en-US',
  }
}
