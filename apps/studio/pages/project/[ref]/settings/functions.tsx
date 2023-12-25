import EdgeFunctionSecrets from 'components/interfaces/Functions/EdgeFunctionSecrets/EdgeFunctionSecrets'
import { SettingsLayout } from 'components/layouts'
import { NextPageWithLayout } from 'types'

const PageLayout: NextPageWithLayout = () => {
  return (
    <div className="1xl:px-28 mx-auto flex flex-col gap-8 px-5 py-6 lg:px-16 xl:px-24 2xl:px-32">
      <EdgeFunctionSecrets />
    </div>
  )
}

PageLayout.getLayout = (page) => <SettingsLayout title="Settings">{page}</SettingsLayout>

export default PageLayout
