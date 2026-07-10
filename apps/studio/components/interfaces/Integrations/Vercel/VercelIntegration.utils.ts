import type { Integration } from '@/data/integrations/integrations.types'

export function isVercelUrl(url: string): boolean {
  try {
    const u = new URL(url)
    return u.protocol === 'https:' && u.hostname === 'vercel.com'
  } catch {
    // If the URL is invalid, return false
    return false
  }
}

export function findVercelIntegrationByConfigurationId(
  integrations: Integration[] | undefined,
  configurationId: string | undefined
): Integration | undefined {
  if (!configurationId) return undefined

  return integrations?.find(
    (integration) =>
      integration.metadata !== undefined &&
      'configuration_id' in integration.metadata &&
      integration.metadata.configuration_id === configurationId
  )
}
