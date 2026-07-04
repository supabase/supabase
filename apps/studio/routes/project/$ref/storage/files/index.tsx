import { createFileRoute } from '@tanstack/react-router'

import StorageFilesPage from '@/pages/project/[ref]/storage/files/index'

export const Route = createFileRoute('/project/$ref/storage/files/')({
  component: StorageFilesIndexRoute,
  staticData: {
    storageLayoutTitle: 'Files',
  },
})

function StorageFilesIndexRoute() {
  return <StorageFilesPage dehydratedState={undefined} />
}
