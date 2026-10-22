import { parseAsStringLiteral } from 'nuqs'

import { usePanelQueryState } from '@/hooks/ui/usePanelQueryState'

export const ADDONS_PANEL_KEYS_ARRAY = ['pitr', 'customDomain', 'ipv4'] as const

export type ADDONS_PANEL_KEYS = undefined | (typeof ADDONS_PANEL_KEYS_ARRAY)[number]

export function useAddonsPagePanel() {
  // push so browser Back closes the add-on side panel
  const [panelParam, setPanelParam] = usePanelQueryState(
    'panel',
    parseAsStringLiteral(ADDONS_PANEL_KEYS_ARRAY).withOptions({
      history: 'push',
    })
  )

  const panel = panelParam ?? undefined

  const setPanel = (nextPanel: ADDONS_PANEL_KEYS) => {
    setPanelParam(nextPanel ?? null)
  }

  const closePanel = () => {
    setPanelParam(null)
  }

  const commitPanel = () => {
    setPanelParam(null)
  }

  return {
    panel,
    setPanel,
    closePanel,
    commitPanel,
  }
}
