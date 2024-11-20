import { INTEGRATIONS } from 'components/interfaces/Integrations/Landing/Integrations.constants'
import { IntegrationWrapper } from 'components/interfaces/Integrations/Landing/IntegrationWrapper'
import { WebhooksListTab } from 'components/interfaces/Integrations/Webhooks/ListTab'
import { WebhooksOverviewTab } from 'components/interfaces/Integrations/Webhooks/OverviewTab'
import ProjectLayout from 'components/layouts/ProjectLayout/ProjectLayout'
import type { NextPageWithLayout } from 'types'

const tabs = [
  {
    id: 'overview',
    label: 'Overview',
    content: (
      <div className="p-9">
        <WebhooksOverviewTab />
      </div>
    ),
  },
  {
    id: 'webhooks',
    label: 'Webhooks',
    content: (
      <div className="p-9">
        <WebhooksListTab />
      </div>
    ),
  },
]

const WebhooksPage: NextPageWithLayout = () => {
  const id = 'supabase-webhooks'

  const integration = INTEGRATIONS.find((i) => i.id === id)

  if (!integration) {
    return null
  }

  return <IntegrationWrapper integration={integration} tabs={tabs} />
}

WebhooksPage.getLayout = (page) => {
  return (
    <ProjectLayout title="Integrations" product="Integrations" isBlocking={false}>
      {page}
    </ProjectLayout>
  )
}

export default WebhooksPage
