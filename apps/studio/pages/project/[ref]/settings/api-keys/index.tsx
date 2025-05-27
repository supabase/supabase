import { LegacyAPIKeys } from 'components/interfaces/APIKeys/LegacyAPIKeys'
import ApiKeysLayout from 'components/layouts/APIKeys/APIKeysLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import SettingsLayout from 'components/layouts/ProjectSettingsLayout/SettingsLayout'
import type { NextPageWithLayout } from 'types'

const ApiKeysLegacyPage: NextPageWithLayout = () => {
  return <LegacyAPIKeys />
}

ApiKeysLegacyPage.getLayout = (page) => (
  <DefaultLayout>
    <SettingsLayout>
      <ApiKeysLayout>{page}</ApiKeysLayout>
    </SettingsLayout>
  </DefaultLayout>
)

export default ApiKeysLegacyPage
