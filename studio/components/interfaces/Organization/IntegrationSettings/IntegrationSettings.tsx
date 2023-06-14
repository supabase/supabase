import { useParams } from 'common'
import { ScaffoldDivider } from 'components/layouts/Scaffold'
import { useIntegrationsQuery } from 'data/integrations/integrations-query'
import { useStore } from 'hooks'
import { observer } from 'mobx-react-lite'
import GitHubRepoSelection from './GitHubRepoSelection'
import Integration from './Integration'

const IntegrationSettings = () => {
  const { ui } = useStore()
  const { slug } = useParams()
  const { data } = useIntegrationsQuery({ orgSlug: slug })

  const org = ui.selectedOrganization

  const vercelIntegrations = data?.filter((integration) => integration.type === 'VERCEL')
  const githubIntegrations = data?.filter((integration) => integration.type === 'GITHUB')

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
      <GitHubRepoSelection />
    </>
  )
}

export default observer(IntegrationSettings)
