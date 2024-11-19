import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useFDWsQuery } from 'data/fdw/fdws-query'
import { IntegrationCard } from './IntegrationCard'
import { INTEGRATIONS } from './Integrations.constants'

export const AvailableIntegrations = () => {
  const { project } = useProjectContext()
  const { data } = useFDWsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  return (
    <div className="p-9 flex flex-col gap-y-5">
      <h2>Available integrations</h2>
      <div className="flex flex-row flex-wrap gap-x-4 gap-y-3">
        {INTEGRATIONS.map((i) => (
          <IntegrationCard {...i} />
        ))}
      </div>
    </div>
  )
}
