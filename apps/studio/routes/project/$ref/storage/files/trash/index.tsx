import { createFileRoute } from '@tanstack/react-router'

import StorageTrashPage from '@/pages/project/[ref]/storage/files/trash/index'

export const Route = createFileRoute('/project/$ref/storage/files/trash/')({
  component: StorageTrashIndexRoute,
  staticData: {
    storageLayoutTitle: 'Trash',
  },
})

function StorageTrashIndexRoute() {
  return <StorageTrashPage dehydratedState={undefined} />
}
