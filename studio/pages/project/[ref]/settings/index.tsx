import { observer } from 'mobx-react-lite'

import { SettingsLayout } from 'components/layouts'
import { NextPageWithLayout } from 'types'

const Settings: NextPageWithLayout = () => {
  return <>{/* <h1>Use this as a page template for settings pages</h1> */}</>
}

Settings.getLayout = (page) => <SettingsLayout>{page}</SettingsLayout>

export default observer(Settings)
