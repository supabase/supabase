import { IntegrationCard } from './IntegrationCard'
import { INTEGRATIONS } from './Integrations.constants'
import { useInstalledIntegrations } from './useInstalledIntegrations'

export const AvailableIntegrations = () => {
  const { isLoading, installedIntegrations: ids } = useInstalledIntegrations()

  // available integrations for install
  const integrations = INTEGRATIONS.filter((i) => !ids.includes(i.id))

  if (isLoading) {
    return <div>Loading</div>
  }

  return (
    <div className="p-9 flex flex-col gap-y-5">
      <h2>Available integrations</h2>
      <div className="flex flex-row flex-wrap gap-x-4 gap-y-3">
        {integrations.map((i) => (
          <IntegrationCard key={i.id} {...i} />
        ))}
      </div>
    </div>
  )
}
