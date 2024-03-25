import { SettingsLayout } from 'components/layouts'
import type { NextPageWithLayout } from 'types'

const Settings: NextPageWithLayout = () => {
  return <>{/* <h1>Use this as a page template for settings pages</h1> */}</>
}

Settings.getLayout = (page) => <SettingsLayout>{page}</SettingsLayout>

export default Settings
