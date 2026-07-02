import { createFileRoute } from '@tanstack/react-router'

import S3SettingsPage from '@/pages/project/[ref]/storage/s3'

export const Route = createFileRoute('/project/$ref/storage/s3')({
  component: StorageS3Route,
  staticData: {
    storageLayoutTitle: 'S3 Configuration',
    storageBucketsLayoutTitle: 'S3 Configuration',
    storageBucketsLayoutHideSubtitle: true,
  },
})

function StorageS3Route() {
  return <S3SettingsPage dehydratedState={undefined} />
}
