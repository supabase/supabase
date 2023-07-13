import { useCallback, useState } from 'react'

import { useParams } from 'common'
import { ScaffoldDivider } from 'components/layouts/Scaffold'
import { useIntegrationsGitHubInstalledConnectionDeleteMutation } from 'data/integrations/integrations-github-connection-delete-mutation'
import { useOrgIntegrationsQuery } from 'data/integrations/integrations-query-org-only'
import { useIntegrationsVercelInstalledConnectionDeleteMutation } from 'data/integrations/integrations-vercel-installed-connection-delete-mutation'
import { useVercelProjectsQuery } from 'data/integrations/integrations-vercel-projects-query'
import { IntegrationProjectConnection } from 'data/integrations/integrations.types'
import { getGitHubConfigurationUrl, getVercelConfigurationUrl } from 'lib/integration-utils'
import Integration from './Integration'
import SidePanelGitHubRepoLinker from './SidePanelGitHubRepoLinker'
import SidePanelVercelProjectLinker from './SidePanelVercelProjectLinker'

const IntegrationSettings = () => {
  const { slug } = useParams()
  const { data } = useOrgIntegrationsQuery({ orgSlug: slug })

  const vercelIntegrations = data
    ?.filter((integration) => integration.integration.name === 'Vercel')
    .map((integration) => {
      if (integration.metadata && integration.integration.name === 'Vercel') {
        const avatarSrc =
          !integration.metadata.account.avatar && integration.metadata.account.type === 'Team'
            ? `https://vercel.com/api/www/avatar?teamId=${integration.metadata.account.team_id}&s=48`
            : `https://vercel.com/api/www/avatar/${integration.metadata.account.avatar}?s=48`

        integration['metadata']['account']['avatar'] = avatarSrc
      }

      return integration
    })
  const githubIntegrations = data?.filter(
    (integration) => integration.integration.name === 'GitHub'
  )

  // We're only supporting one Vercel integration per org for now
  // this will need to be updated when we support multiple integrations
  const vercelIntegration = vercelIntegrations?.[0]
  const { data: vercelProjectsData } = useVercelProjectsQuery(
    {
      organization_integration_id: vercelIntegration?.id,
    },
    { enabled: vercelIntegration?.id !== undefined }
  )
  const vercelProjectCount = vercelProjectsData?.length ?? 0

  const [addPanelOpen, setAddPanelOpen] = useState<undefined | 'VERCEL' | 'GITHUB'>(undefined)
  const [addPanelIntegrationId, setAddPanelIntegrationId] = useState<string | undefined>(undefined)

  const onAddVercelConnection = useCallback((integrationId: string) => {
    setAddPanelIntegrationId(integrationId)
    setAddPanelOpen('VERCEL')
  }, [])

  const onAddGitHubConnection = useCallback((integrationId: string) => {
    setAddPanelIntegrationId(integrationId)
    setAddPanelOpen('GITHUB')
  }, [])

  const onCloseAddPanel = useCallback(() => {
    setAddPanelOpen(undefined)
    setAddPanelIntegrationId(undefined)
  }, [])

  const { mutateAsync: deleteVercelConnection } =
    useIntegrationsVercelInstalledConnectionDeleteMutation()

  const onDeleteVercelConnection = useCallback(
    async (connection: IntegrationProjectConnection) => {
      await deleteVercelConnection({
        id: connection.id,
        organization_integration_id: connection.organization_integration_id,
        orgSlug: slug,
      })
    },
    [deleteVercelConnection, slug]
  )

  const { mutateAsync: deleteGitHubConnection } =
    useIntegrationsGitHubInstalledConnectionDeleteMutation()

  const onDeleteGitHubConnection = useCallback(
    async (connection: IntegrationProjectConnection) => {
      await deleteGitHubConnection({
        connectionId: connection.id,
        integrationId: connection.organization_integration_id,
        orgSlug: slug,
      })
    },
    [deleteGitHubConnection, slug]
  )

  return (
    <>
      <Integration
        title="Vercel"
        detail={`
## Vercel Integration

Connect your Vercel teams to your Supabase organization.
`}
        description={`
### How does the Vercel integration work?

Supabase will keep the right environment variables up to date in each of the projects you assign to a Supabase project. 
You can also link multiple Vercel Projects to the same Supabase project.
`}
        note={
          vercelProjectCount > 0 && vercelIntegration !== undefined
            ? `
Your Vercel connection has access to ${vercelProjectCount} Vercel Projects. 
You can change the scope of the access for Supabase by configuring [here](${getVercelConfigurationUrl(
                vercelIntegration
              )}).
`
            : undefined
        }
        integrations={vercelIntegrations}
        getManageUrl={getVercelConfigurationUrl}
        onAddConnection={onAddVercelConnection}
        onDeleteConnection={onDeleteVercelConnection}
      />
      <ScaffoldDivider />
      <Integration
        title="GitHub"
        detail={`
## GitHub Connections

Connect any of your GitHub repositories to a project.
`}
        description={`
### How will GitHub connections work?

You will be able to connect a GitHub repository to a Supabase project. 
The GitHub app will watch for changes in your repository such as file changes, branch changes as well as pull request activity.

These connections will be part of a GitHub workflow that is currently in development.
`}
        integrations={githubIntegrations}
        getManageUrl={getGitHubConfigurationUrl}
        onAddConnection={onAddGitHubConnection}
        onDeleteConnection={onDeleteGitHubConnection}
      />
      <SidePanelVercelProjectLinker
        isOpen={addPanelOpen === 'VERCEL'}
        organizationIntegrationId={addPanelIntegrationId}
        onClose={onCloseAddPanel}
      />
      <SidePanelGitHubRepoLinker
        isOpen={addPanelOpen === 'GITHUB'}
        organizationIntegrationId={addPanelIntegrationId}
        onClose={onCloseAddPanel}
      />
    </>
  )
}

export default IntegrationSettings
