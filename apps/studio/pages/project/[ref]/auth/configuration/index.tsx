import { useParams } from 'common'
import { BasicAuthSettingsForm } from 'components/interfaces/Auth'
import AppLayout from 'components/layouts/AppLayout/AppLayout'
import AuthLayout from 'components/layouts/AuthLayout/AuthLayout'
import { generateAuthConfigurationMenu } from 'components/layouts/AuthLayout/AuthLayout.utils'
import DefaultLayout from 'components/layouts/DefaultLayout'
import ProjectSubNavigationLayout from 'components/layouts/project-sub-navigation-layout'
import type { NextPageWithLayout } from 'types'

const PageLayout: NextPageWithLayout = () => {
  return <BasicAuthSettingsForm />
}

PageLayout.getLayout = (page) => {
  // const { ref } = useParams()
  return (
    <AppLayout>
      <DefaultLayout>
        <AuthLayout>
          {/* <ProjectSubNavigationLayout submenu={generateAuthConfigurationMenu(ref as string)}> */}
          {page}
          {/* </ProjectSubNavigationLayout> */}
        </AuthLayout>
      </DefaultLayout>
    </AppLayout>
  )
}

export default PageLayout
