import ApiKeysLayout from 'components/layouts/APIKeys/APIKeysLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import SettingsLayout from 'components/layouts/ProjectSettingsLayout/SettingsLayout'
import { DisplayApiSettings } from 'components/ui/ProjectSettings/DisplayApiSettings'
import { ToggleLegacyApiKeysPanel } from 'components/ui/ProjectSettings/ToggleLegacyApiKeys'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import type { NextPageWithLayout } from 'types'

const ApiKeysLegacyPage: NextPageWithLayout = () => {
  return (
    <>
      <DisplayApiSettings showTitle={false} showNotice={false} />
      <ToggleLegacyApiKeysPanel />
    </>
  )
}

ApiKeysLegacyPage.getLayout = (page) => (
  <DefaultLayout>
    <SettingsLayout>
      <ApiKeysLayout>{page}</ApiKeysLayout>
    </SettingsLayout>
  </DefaultLayout>
)

export default ApiKeysLegacyPage
