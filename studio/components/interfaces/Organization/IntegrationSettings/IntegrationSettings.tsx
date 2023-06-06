import { observer } from 'mobx-react-lite'

import { useParams } from 'common'
import { useIntegrationsQuery } from 'data/integrations/integrations-query'
import { useStore } from 'hooks'
import Integration from './Integration'

const IntegrationSettings = () => {
  const { ui } = useStore()
  const { slug } = useParams()
  const { data } = useIntegrationsQuery({ orgSlug: slug })

  const org = ui.selectedOrganization

  const vercelIntegrations = data?.filter((integration) => integration.type === 'VERCEL')

  return (
    <div className="grid grid-cols-2 gap-y-8 mt-8">
      <Integration
        title="Vercel"
        orgName={org?.name}
        description="Supabase will keep the right environment variables up to date in each of the projects you assign to a Supabase project. You can also link multiple Vercel Projects to the same Supabase project."
        note="Your Vercel connection has access to 7 Vercel Projects. You can change the scope of the access for Supabase by configuring here."
        integrations={vercelIntegrations}
      />
    </div>
  )
}

export default observer(IntegrationSettings)
