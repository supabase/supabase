import { GraphiQLTab } from 'components/interfaces/Integrations/GraphQL/GraphiQLTab'
import { IntegrationOverviewTab } from 'components/interfaces/Integrations/Integration/IntegrationOverviewTab'
import { INTEGRATIONS } from 'components/interfaces/Integrations/Landing/Integrations.constants'
import IntegrationsLayout from 'components/layouts/Integrations/layout'
import { parseAsString, useQueryState } from 'nuqs'
import type { NextPageWithLayout } from 'types'

const GraphiQL: NextPageWithLayout = () => {
  const id = 'graphiql'
  const integration = INTEGRATIONS.find((i) => i.id === id)

  const [selectedTab] = useQueryState('tab', parseAsString.withDefault('overview'))

  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      content: <IntegrationOverviewTab integration={integration} />,
    },
    {
      id: 'graphiql',
      label: 'GraphiQL',
      content: (
        <div className="h-full w-full">
          <GraphiQLTab />
        </div>
      ),
    },
  ]

  if (!integration) {
    return null
  }

  return (
    <IntegrationsLayout id={id} tabs={tabs}>
      {tabs.find((t) => t.id === selectedTab)?.content}
    </IntegrationsLayout>
  )
}

export default GraphiQL
