import { S3Connection } from 'components/interfaces/Storage/StorageSettings/S3Connection'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { StorageBucketsLayout } from 'components/layouts/StorageLayout/StorageBucketsLayout'
import StorageLayout from 'components/layouts/StorageLayout/StorageLayout'
import type { NextPageWithLayout } from 'types'

const S3SettingsPage: NextPageWithLayout = () => {
  return <S3Connection />
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
