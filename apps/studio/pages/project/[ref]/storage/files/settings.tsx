import { StorageSettings } from 'components/interfaces/Storage/StorageSettings/StorageSettings'
import { S3Connection } from 'components/interfaces/Storage/StorageSettings/S3Connection'
import { BucketTypeLayout } from 'components/layouts/StorageLayout/BucketLayout'
import type { NextPageWithLayout } from 'types'

const FilesSettingsPage: NextPageWithLayout = () => {
  return (
    <>
      <StorageSettings />
      <S3Connection />
    </>
  )
}

FilesSettingsPage.getLayout = (page) => <BucketTypeLayout isEmpty={false}>{page}</BucketTypeLayout>

export default FilesSettingsPage
