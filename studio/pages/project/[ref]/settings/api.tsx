import { IconAlertCircle } from 'ui'

import ServiceList from 'components/interfaces/Settings/API/ServiceList'
import { SettingsLayout } from 'components/layouts'
import { useIsProjectActive } from 'components/layouts/ProjectLayout/ProjectContext'
import { NextPageWithLayout } from 'types'

const ApiSettings: NextPageWithLayout = () => {
  const isActive = useIsProjectActive()

  return (
    <div className="flex flex-col gap-8 px-5 py-6 mx-auto 1xl:px-28 lg:px-16 xl:px-24 2xl:px-32">
      {isActive ? (
        <ServiceList />
      ) : (
        <div>
          <h3 className="mb-6 text-xl text-foreground">API Settings</h3>
          <div className="flex items-center justify-center rounded border border-overlay bg-surface-100 p-8">
            <IconAlertCircle strokeWidth={1.5} />
            <p className="text-sm text-foreground-light ml-2">
              API settings are unavailable as the project is not active
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

ApiSettings.getLayout = (page) => <SettingsLayout title="API Settings">{page}</SettingsLayout>

export default ApiSettings
