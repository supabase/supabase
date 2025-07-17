import { env } from '../env.config'

export function isLocal(url?: string): boolean {
  if (!url) {
    return env.STUDIO_URL.includes('localhost') || env.API_URL.includes('127.0.0.1')
  }

  return url.includes('localhost') || url.includes('127.0.0.1')
}
