import ServiceList from 'components/interfaces/Settings/API/ServiceList'
import { SettingsLayout } from 'components/layouts'
import { NextPageWithLayout } from 'types'

const ApiSettings: NextPageWithLayout = () => {
  return (
    <div className="flex flex-col gap-8 px-5 py-6 mx-auto 1xl:px-28 lg:px-16 xl:px-24 2xl:px-32">
      <ServiceList />
    </div>
  )
}

ApiSettings.getLayout = (page) => <SettingsLayout title="API Settings">{page}</SettingsLayout>
export default ApiSettings
