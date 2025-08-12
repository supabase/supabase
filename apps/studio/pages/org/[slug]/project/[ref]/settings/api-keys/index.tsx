import ApiKeysLayout from 'components/layouts/APIKeys/APIKeysLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import SettingsLayout from 'components/layouts/ProjectSettingsLayout/SettingsLayout'
import { DisplayApiSettings } from 'components/ui/ProjectSettings'
import type { NextPageWithLayout } from 'types'

const ApiKeysLegacyPage: NextPageWithLayout = () => {
  return <DisplayApiSettings showTitle={false} showNotice={false} />
}

ApiKeysLegacyPage.getLayout = (page) => (
  <DefaultLayout>
    <SettingsLayout>
      <ApiKeysLayout>{page}</ApiKeysLayout>
    </SettingsLayout>
  </DefaultLayout>
)

export default ApiKeysLegacyPage
