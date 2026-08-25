import { IS_PLATFORM } from 'common'

import ApiKeysLayout from '@/components/layouts/APIKeys/APIKeysLayout'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import SettingsLayout from '@/components/layouts/ProjectSettingsLayout/SettingsLayout'
import { HighAvailabilityDisabledEmptyState } from '@/components/ui/HighAvailability/HighAvailabilityDisabledEmptyState'
import { DisplayApiSettings } from '@/components/ui/ProjectSettings/DisplayApiSettings'
import { ToggleLegacyApiKeysPanel } from '@/components/ui/ProjectSettings/ToggleLegacyApiKeys'
import { useHighAvailability } from '@/hooks/misc/useHighAvailability'
import type { NextPageWithLayout } from '@/types'

const ApiKeysLegacyPage: NextPageWithLayout = () => {
  const { isHighAvailability } = useHighAvailability()

  if (isHighAvailability) {
    return (
      <HighAvailabilityDisabledEmptyState
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

ApiKeysLegacyPage.getLayout = (page) => (
  <DefaultLayout>
    <SettingsLayout title="API Keys (Legacy)">
      <ApiKeysLayout>{page}</ApiKeysLayout>
    </SettingsLayout>
  </DefaultLayout>
)

export default ApiKeysLegacyPage
