import { IS_PLATFORM } from 'common'

import { S3Connection } from '@/components/interfaces/Storage/StorageSettings/S3Connection'
import { S3ConnectionSelfHosted } from '@/components/interfaces/Storage/StorageSettings/S3ConnectionSelfHosted'
import DefaultLayout from '@/components/layouts/DefaultLayout'
import { StorageBucketsLayout } from '@/components/layouts/StorageLayout/StorageBucketsLayout'
import StorageLayout from '@/components/layouts/StorageLayout/StorageLayout'
import { useDeploymentMode } from '@/hooks/misc/useDeploymentMode'
import type { NextPageWithLayout } from '@/types'

const S3SettingsPage: NextPageWithLayout = () => {
  const { isSelfHosted } = useDeploymentMode()

  if (IS_PLATFORM) return <S3Connection />
  if (isSelfHosted) return <S3ConnectionSelfHosted />
  return null
}

S3SettingsPage.getLayout = (page) => (
  <DefaultLayout>
    <StorageLayout title="S3 Configuration">
      <StorageBucketsLayout hideSubtitle title="S3 Configuration">
        {page}
      </StorageBucketsLayout>
    </StorageLayout>
  </DefaultLayout>
)

export default S3SettingsPage
