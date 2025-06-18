import JWTKeysLayout from 'components/layouts/JWTKeys/JWTKeysLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import SettingsLayout from 'components/layouts/ProjectSettingsLayout/SettingsLayout'
import { DisplayApiSettings } from 'components/ui/ProjectSettings'
import type { NextPageWithLayout } from 'types'

const JWTKeysLegacyPage: NextPageWithLayout = () => {
  return <DisplayApiSettings showTitle={false} showNotice={false} />
}

JWTKeysLegacyPage.getLayout = (page) => (
  <DefaultLayout>
    <SettingsLayout>
      <JWTKeysLayout>{page}</JWTKeysLayout>
    </SettingsLayout>
  </DefaultLayout>
)

export default JWTKeysLegacyPage
