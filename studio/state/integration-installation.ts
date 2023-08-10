import { proxy, snapshot, useSnapshot } from 'valtio'

export const integrationInstallationState = proxy({
  loading: false as boolean,
  setLoading: (boolean: boolean) => {
    integrationInstallationState.loading = boolean
  },
})

export const getIntegrationInstallation = () => snapshot(integrationInstallationState)

export const useIntegrationInstallationSnapshot = (options?: Parameters<typeof useSnapshot>[1]) =>
  useSnapshot(integrationInstallationState, options)
