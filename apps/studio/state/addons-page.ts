import { useUrlState } from 'hooks/ui/useUrlState'

export const ADDONS_PANEL_KEYS_ARRAY = ['computeInstance', 'pitr', 'customDomain', 'ipv4'] as const

export type ADDONS_PANEL_KEYS = undefined | (typeof ADDONS_PANEL_KEYS_ARRAY)[number]

export function useAddonsPagePanel() {
  const [{ panel: _panel }, setParams] = useUrlState({ replace: true })

  const panel = ADDONS_PANEL_KEYS_ARRAY.find((key) => key === _panel)

  const setPanel = (panel: ADDONS_PANEL_KEYS) => {
    setParams({ panel })
  }

  const closePanel = () => {
    setParams({ panel: undefined })
  }

  return {
    panel,
    setPanel,
    closePanel,
  }
}
