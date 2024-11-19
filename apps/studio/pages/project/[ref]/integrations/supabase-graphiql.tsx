import { GraphiQLTab } from 'components/interfaces/Integrations/GraphQL/GraphiQLTab'
import { GraphqlOverviewTab } from 'components/interfaces/Integrations/GraphQL/OverviewTab'
import { INTEGRATIONS } from 'components/interfaces/Integrations/Landing/Integrations.constants'
import { IntegrationWrapper } from 'components/interfaces/Integrations/Landing/IntegrationWrapper'
import ProjectLayout from 'components/layouts/ProjectLayout/ProjectLayout'
import type { NextPageWithLayout } from 'types'

const tabs = [
  {
    id: 'overview',
    label: 'Overview',
    content: (
      <div className="p-9">
        <GraphqlOverviewTab />
      </div>
    ),
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
  const id = 'supabase-graphiql'

  const integration = INTEGRATIONS.find((i) => i.id === id)

  if (!integration) {
    return null
  }

  return <IntegrationWrapper integration={integration} tabs={tabs} />
}

GraphiQL.getLayout = (page) => {
  return (
    <ProjectLayout title="Integrations" product="Integrations" isBlocking={false}>
      {page}
    </ProjectLayout>
  )
}

export default GraphiQL
