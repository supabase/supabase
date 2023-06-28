import { ScaffoldDivider } from 'components/layouts/Scaffold'
import { useOrgIntegrationsQuery } from 'data/integrations/integrations-query-org-only'
import { useSelectedOrganization } from 'hooks'
import Integration from './Integration'
import SidePanelVercelProjectLinker from './SidePanelVercelProjectLinker'

const IntegrationSettings = () => {
  const org = useSelectedOrganization()
  const { data } = useOrgIntegrationsQuery({ orgSlug: org?.slug })

  const vercelIntegrations = data?.filter(
    (integration) => integration.integration.name === 'Vercel'
  ) // vercel
  const githubIntegrations = data?.filter(
    (integration) => integration.integration.name === 'GitHub'
  ) // github

  vercelIntegrations?.map((x) => {
    let data: any = { ...x }

    const avatarSrc = data.metadata.account.avatar
      ? `https://vercel.com/api/www/avatar/${data.metadata.account.avatar}?s=48`
      : `https://vercel.com/api/www/avatar?teamId=${data.metadata.account.team_id}&s=48`
    data['metadata']['account']['avatar'] = avatarSrc

    return data
  })

  return (
    <>
      <Integration
        title="Vercel"
        orgName={org?.name}
        detail={`
## Vercel Integration

Connect your Vercel teams to your Supabase organization.
`}
        description={`
### How does the Vercel integration work?

Supabase will keep the right environment variables up to date in each of the projects you assign to a Supabase project. 
You can also link multiple Vercel Projects to the same Supabase project.
`}
        note={`
Your Vercel connection has access to 7 Vercel Projects. 
You can change the scope of the access for Supabase by configuring here.
`}
        integrations={vercelIntegrations}
      />
      <ScaffoldDivider />
      <Integration
        title="GitHub"
        orgName={org?.name}
        detail={`
## GitHub Connections

Conect any of your GitHub repositories to a project.
`}
        description={`
### How do GitHub connections work?

Supabase will keep the right environment variables up to date in each of the projects you assign to a Supabase project. 
You can also link multiple Vercel Projects to the same Supabase project.
`}
        note={`
Your Vercel connection has access to 7 Vercel Projects. 
You can change the scope of the access for Supabase by configuring here.
`}
        integrations={githubIntegrations}
      />
      <SidePanelVercelProjectLinker />
    </>
  )
}

export default IntegrationSettings
