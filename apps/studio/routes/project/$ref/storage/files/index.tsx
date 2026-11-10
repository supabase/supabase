import { createFileRoute } from '@tanstack/react-router'

import { FilesBuckets } from '@/components/interfaces/Storage/FilesBuckets'

export const Route = createFileRoute('/project/$ref/storage/files/')({
  component: StorageFilesPage,
  staticData: {
    storageLayoutTitle: 'Files',
  },
})

function StorageFilesPage() {
  return <FilesBuckets />
}
