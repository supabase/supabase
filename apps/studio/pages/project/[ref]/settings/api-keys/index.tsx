import { IS_PLATFORM } from 'common'
import ApiKeysLayout from 'components/layouts/APIKeys/APIKeysLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import SettingsLayout from 'components/layouts/ProjectSettingsLayout/SettingsLayout'
import { DisplayApiSettings } from 'components/ui/ProjectSettings/DisplayApiSettings'
import { DisplayApiSettingsLocalState } from 'components/ui/ProjectSettings/DisplayApiSettingsLocalState'
import { ToggleLegacyApiKeysPanel } from 'components/ui/ProjectSettings/ToggleLegacyApiKeys'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import type { NextPageWithLayout } from 'types'

const ApiKeysLegacyPage: NextPageWithLayout = () => {
  const { projectSettingsShowDisableLegacyApiKeys } = useIsFeatureEnabled([
    'project_settings:show_disable_legacy_api_keys',
  ])

  return (
    <>
      {IS_PLATFORM ? (
        <>
          <DisplayApiSettings showTitle={false} showNotice={false} />
          {projectSettingsShowDisableLegacyApiKeys && <ToggleLegacyApiKeysPanel />}
        </>
      ) : (
        <DisplayApiSettingsLocalState showTitle={false} showNotice={false} />
      )}
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
