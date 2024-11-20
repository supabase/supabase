import { IntegrationCard } from './IntegrationCard'
import { INTEGRATIONS } from './Integrations.constants'
import { useInstalledIntegrations } from './useInstalledIntegrations'

export const InstalledIntegrations = () => {
  const { isLoading, installedIntegrations: ids } = useInstalledIntegrations()

  const installedIntegrations = INTEGRATIONS.filter((i) => ids.includes(i.id))

  if (isLoading) {
    return <div>Loading</div>
  }

  if (installedIntegrations.length === 0) {
    return (
      <div className="px-9 w-full h-48 py-6">
        <div className="border rounded-lg h-full">
          Some placeholder image when no integrations are installed
        </div>
      </div>
    )
  }

  return (
    <div className="px-9 py-6 flex flex-col gap-y-5">
      <h2>Available integrations</h2>
      <div className="flex flex-row flex-wrap gap-x-4 gap-y-3">
        {installedIntegrations.map((i) => (
          <IntegrationCard key={i.id} {...i} />
        ))}
      </div>
    </div>
  )
}
