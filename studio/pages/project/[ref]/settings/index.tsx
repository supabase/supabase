import { NextPage } from 'next'
import { observer } from 'mobx-react-lite'

import { withAuth } from 'hooks'
import { SettingsLayout } from 'components/layouts'

const Settings: NextPage = () => {
  return (
    <SettingsLayout>
      <div className="p-5">
        <h1>Settings</h1>
      </div>
    </SettingsLayout>
  )
}

export default withAuth(observer(Settings))
