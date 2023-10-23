import { IntegrationsData } from 'data/integrations/integrations-query'
import { IntegrationName } from 'data/integrations/integrations.types'
import { Organization } from 'types'

export function getHasInstalledObject({
  integrationName,
  integrationData,
  organizationsData,
  installationId,
}: {
  integrationName: IntegrationName
  integrationData: IntegrationsData
  organizationsData: Organization[]
  installationId?: string | number
}): { [orgSlug: string]: boolean } {
  if (integrationName === 'Vercel') {
    return Object.fromEntries(
      organizationsData
        .map((org) => [
          org.slug,
          Boolean(
            integrationData.find(
              (integration) =>
                integration.organization.slug === org.slug &&
                integration.integration.name === 'Vercel'
            )
          ),
        ])
        .filter(([, v]) => Boolean(v))
    )
  }

  if (integrationName === 'GitHub') {
    return Object.fromEntries(
      organizationsData
        .map((org) => [
          org.slug,
          Boolean(
            integrationData.find(
              (integration) =>
                integration.organization.slug === org.slug &&
                integration.integration.name === 'GitHub' &&
                integration.metadata !== undefined &&
                'installation_id' in integration.metadata &&
                String(integration.metadata.installation_id) === String(installationId)
            )
          ),
        ])
        .filter(([, v]) => Boolean(v))
    )
  }

  return {}
}
