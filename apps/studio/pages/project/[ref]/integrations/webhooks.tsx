import { INTEGRATIONS } from 'components/interfaces/Integrations/Landing/Integrations.constants'
import { WebhooksListTab } from 'components/interfaces/Integrations/Webhooks/ListTab'
import { WebhooksOverviewTab } from 'components/interfaces/Integrations/Webhooks/OverviewTab'
import IntegrationsLayout from 'components/layouts/Integrations/layout'
import { parseAsString, useQueryState } from 'nuqs'
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
  const id = 'webhooks'
  const integration = INTEGRATIONS.find((i) => i.id === id)

  const [selectedTab] = useQueryState('tab', parseAsString.withDefault('overview'))

  if (!integration) {
    return null
  }

  return (
    <IntegrationsLayout id={id} tabs={tabs}>
      {tabs.find((t) => t.id === selectedTab)?.content}
    </IntegrationsLayout>
  )
}

export default WebhooksPage
