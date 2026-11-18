import { PrivacySettings, PrivacySettingsLabel } from 'ui-patterns/PrivacySettings'

export function PrivacySettingsIsland() {
  return (
    <>
      <span className="hidden text-xs text-foreground-lighter sm:inline">—</span>
      <PrivacySettings className="text-left text-xs text-foreground-lighter hover:underline">
        <PrivacySettingsLabel />
      </PrivacySettings>
    </>
  )
}
