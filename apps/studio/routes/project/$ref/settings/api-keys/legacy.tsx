import { createFileRoute } from '@tanstack/react-router'
import { IS_PLATFORM } from 'common'

import { HighAvailabilityDisabledEmptyState } from '@/components/ui/HighAvailability/HighAvailabilityDisabledEmptyState'
import { DisplayApiSettings } from '@/components/ui/ProjectSettings/DisplayApiSettings'
import { ToggleLegacyApiKeysPanel } from '@/components/ui/ProjectSettings/ToggleLegacyApiKeys'
import { useHighAvailability } from '@/hooks/misc/useHighAvailability'

export const Route = createFileRoute('/project/$ref/settings/api-keys/legacy')({
  component: ApiKeysLegacyPage,
  staticData: { settingsLayoutTitle: 'API Keys (Legacy)' },
})

function ApiKeysLegacyPage() {
  const { isHighAvailability } = useHighAvailability()

  if (isHighAvailability) {
    return (
      <HighAvailabilityDisabledEmptyState
        className="max-w-full"
        title="Legacy API keys are unavailable on High Availability projects"
        description="High Availability projects only support publishable and secret API keys."
      />
    )
  }

  return (
    <>
      <DisplayApiSettings showTitle={false} showNotice={false} />
      {IS_PLATFORM && <ToggleLegacyApiKeysPanel />}
    </>
  )
}
