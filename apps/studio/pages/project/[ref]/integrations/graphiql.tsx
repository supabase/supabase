import { GraphiQLTab } from 'components/interfaces/Integrations/GraphQL/GraphiQLTab'
import { GraphqlOverviewTab } from 'components/interfaces/Integrations/GraphQL/OverviewTab'
import { INTEGRATIONS } from 'components/interfaces/Integrations/Landing/Integrations.constants'
import IntegrationsLayout from 'components/layouts/Integrations/layout'
import { parseAsString, useQueryState } from 'nuqs'
import type { NextPageWithLayout } from 'types'

const tabs = [
  {
    id: 'overview',
    label: 'Overview',
    content: <GraphqlOverviewTab />,
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

const GraphiQL: NextPageWithLayout = () => {
  const id = 'graphiql'
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

export default GraphiQL
