import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'

import { DiskManagementForm } from '@/components/interfaces/DiskManagement/DiskManagementForm'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import SettingsLayout from '@/components/layouts/ProjectSettingsLayout/SettingsLayout'
import type { NextPageWithLayout } from '@/types'

const ComputeAndDiskSettings: NextPageWithLayout = () => {
  return (
    <>
      <PageHeader size="default">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>Compute and Disk</PageHeaderTitle>
            <PageHeaderDescription>
              Configure the compute and disk settings for your project.
            </PageHeaderDescription>
          </PageHeaderSummary>
        </PageHeaderMeta>
      </PageHeader>
      <DiskManagementForm />
    </>
  )
}

ComputeAndDiskSettings.getLayout = (page) => (
  <DefaultLayout>
    <SettingsLayout title="Compute and Disk">{page}</SettingsLayout>
  </DefaultLayout>
)
export default ComputeAndDiskSettings
