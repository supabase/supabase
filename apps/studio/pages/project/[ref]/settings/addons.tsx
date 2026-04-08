import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'

import { Addons } from '@/components/interfaces/Settings/Addons/Addons'
import DefaultLayout from '@/components/layouts/DefaultLayout'
import SettingsLayout from '@/components/layouts/ProjectSettingsLayout/SettingsLayout'
import type { NextPageWithLayout } from '@/types'

const ProjectAddons: NextPageWithLayout = () => {
  return (
    <>
      <PageHeader size="default">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>Add-ons</PageHeaderTitle>
            <PageHeaderDescription>Level up your project with add-ons</PageHeaderDescription>
          </PageHeaderSummary>
        </PageHeaderMeta>
      </PageHeader>
      <Addons />
    </>
  )
}

ProjectAddons.getLayout = (page) => (
  <DefaultLayout>
    <SettingsLayout title="Add-ons">{page}</SettingsLayout>
  </DefaultLayout>
)
export default ProjectAddons
