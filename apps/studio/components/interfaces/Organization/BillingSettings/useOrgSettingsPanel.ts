import { parseAsStringLiteral, useQueryState } from 'nuqs'

export const ORG_SETTINGS_PANEL_KEYS = ['subscriptionPlan', 'costControl'] as const
export type OrgSettingsPanelKey = (typeof ORG_SETTINGS_PANEL_KEYS)[number]

export const useOrgSettingsPanel = () => {
  const [panel, setPanel] = useQueryState('panel', parseAsStringLiteral(ORG_SETTINGS_PANEL_KEYS))
  return { panel, setPanel }
}
