import { PrivacySettings, PrivacySettingsLabel } from 'ui-patterns/PrivacySettings'

export function PrivacySettingsIsland() {
  return (
    <PrivacySettings className="text-left text-xs text-foreground-lighter hover:underline">
      <PrivacySettingsLabel />
    </PrivacySettings>
  )
}
