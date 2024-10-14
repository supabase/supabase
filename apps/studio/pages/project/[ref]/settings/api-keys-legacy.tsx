import LegacyAPIKeys from 'components/interfaces/APIKeys/LegacyAPIKeys'
import ApiKeysLayout from 'components/layouts/project/[ref]/settings/APIKeysLayout'
import SettingsLayout from 'components/layouts/ProjectSettingsLayout/SettingsLayout'
import type { NextPageWithLayout } from 'types'

const AuthSettings: NextPageWithLayout = () => {
  return <LegacyAPIKeys />
}

AuthSettings.getLayout = (page) => (
  <SettingsLayout>
    <ApiKeysLayout>{page}</ApiKeysLayout>
  </SettingsLayout>
)
export default AuthSettings
