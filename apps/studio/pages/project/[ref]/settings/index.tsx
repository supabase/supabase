import AppLayout from 'components/layouts/AppLayout/AppLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import SettingsLayout from 'components/layouts/ProjectSettingsLayout/SettingsLayout'
import type { NextPageWithLayout } from 'types'

const Settings: NextPageWithLayout = () => {
  return <>{/* <h1>Use this as a page template for settings pages</h1> */}</>
}

Settings.getLayout = (page) => (
  <AppLayout>
    <DefaultLayout>
      <SettingsLayout>{page}</SettingsLayout>
    </DefaultLayout>
  </AppLayout>
)

export default Settings
