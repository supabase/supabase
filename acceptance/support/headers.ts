import { getAcceptanceConfig } from './config'

export function createAcceptanceHeaders(headers?: Record<string, string>): Headers {
  return new Headers(withAcceptanceHeaders(headers))
}

export function withAcceptanceHeaders(
  headers: Record<string, string> = {}
): Record<string, string> {
  const config = getAcceptanceConfig()
  const next = { ...headers }

  if (config.forwardedHost && !hasHeader(next, 'x-forwarded-host')) {
    next['x-forwarded-host'] = config.forwardedHost
  }

  return next
}

export function hasHeader(headers: Record<string, string>, name: string) {
  const normalized = name.toLowerCase()
  return Object.keys(headers).some((key) => key.toLowerCase() === normalized)
}
