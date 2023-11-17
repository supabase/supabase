import { proxy, snapshot, useSnapshot } from 'valtio'

export type ORG_SETTINGS_PANEL_KEYS = undefined | 'subscriptionPlan' | 'costControl'

export const orgSettingsPageState = proxy({
  panelKey: undefined as ORG_SETTINGS_PANEL_KEYS,
  setPanelKey: (key: ORG_SETTINGS_PANEL_KEYS) => {
    orgSettingsPageState.panelKey = key
  },
})

export const getOrgSettingsPageStateSnapshot = () => snapshot(orgSettingsPageState)

export const useOrgSettingsPageStateSnapshot = (options?: Parameters<typeof useSnapshot>[1]) =>
  useSnapshot(orgSettingsPageState, options)
