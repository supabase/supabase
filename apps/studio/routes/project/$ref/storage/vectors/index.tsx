import { createFileRoute } from '@tanstack/react-router'

import StorageVectorsPage from '@/pages/project/[ref]/storage/vectors/index'

export const Route = createFileRoute('/project/$ref/storage/vectors/')({
  component: StorageVectorsIndexRoute,
  staticData: {
    storageLayoutTitle: 'Vectors',
  },
})

function StorageVectorsIndexRoute() {
  return <StorageVectorsPage dehydratedState={undefined} />
}
