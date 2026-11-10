import { createFileRoute } from '@tanstack/react-router'

import { S3Connection } from '@/components/interfaces/Storage/StorageSettings/S3Connection'

export const Route = createFileRoute('/project/$ref/storage/s3')({
  component: S3SettingsPage,
  staticData: {
    storageLayoutTitle: 'S3 Configuration',
    storageBucketsLayoutTitle: 'S3 Configuration',
    storageBucketsLayoutHideSubtitle: true,
  },
})

function S3SettingsPage() {
  return <S3Connection />
}
