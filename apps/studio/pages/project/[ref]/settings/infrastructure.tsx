import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'

import { DiskManagementForm } from '@/components/interfaces/DiskManagement/DiskManagementForm'
import DefaultLayout from '@/components/layouts/DefaultLayout'
import SettingsLayout from '@/components/layouts/ProjectSettingsLayout/SettingsLayout'
import type { NextPageWithLayout } from '@/types'

const InfrastructureSettings: NextPageWithLayout = () => {
  return (
    <>
      <PageHeader size="default" className="pb-12">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>Infrastructure</PageHeaderTitle>
            <PageHeaderDescription>
              View and configure compute and disk for your project.
            </PageHeaderDescription>
          </PageHeaderSummary>
        </PageHeaderMeta>
      </PageHeader>
      <DiskManagementForm />
    </>
  )
}

InfrastructureSettings.getLayout = (page) => (
  <DefaultLayout>
    <SettingsLayout title="Infrastructure">{page}</SettingsLayout>
  </DefaultLayout>
)
export default InfrastructureSettings
