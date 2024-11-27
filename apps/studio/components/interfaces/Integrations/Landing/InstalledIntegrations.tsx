import AlertError from 'components/ui/AlertError'
import { IntegrationCard, IntegrationLoadingCard } from './IntegrationCard'
import { useInstalledIntegrations } from './useInstalledIntegrations'

export const InstalledIntegrations = () => {
  const { installedIntegrations, error, isLoading, isSuccess, isError } = useInstalledIntegrations()

  return (
    <div className="px-10 py-6 flex flex-col gap-y-5">
      <h2>Installed integrations</h2>
      <div className="grid xl:grid-cols-3 2xl:grid-cols-4 gap-x-4 gap-y-3">
        {isLoading &&
          new Array(3)
            .fill(0)
            .map((_, idx) => <IntegrationLoadingCard key={`integration-loading-${idx}`} />)}
        {isError && (
          <AlertError
            className="xl:col-span-3 2xl:col-span-4"
            subject="Failed to retrieve installed integrations"
            error={error}
          />
        )}
        {isSuccess && (
          <>
            {installedIntegrations.length === 0 ? (
              <div className="xl:col-span-3 2xl:col-span-4 w-full h-[110px] border rounded flex items-center justify-center">
                {/* [Joshen] Not high priority imo - very low chance this state will be seen cause Vault is always installed */}
                {/* Some placeholder image when no integrations are installed */}
                <p className="text-sm text-foreground-light">No integrations installed yet</p>
              </div>
            ) : (
              installedIntegrations.map((i) => <IntegrationCard key={i.id} {...i} />)
            )}
          </>
        )}
      </div>
    </div>
  )
}
