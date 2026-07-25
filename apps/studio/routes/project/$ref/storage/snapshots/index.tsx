import { createFileRoute } from '@tanstack/react-router'

import StorageSnapshotsPage from '@/pages/project/[ref]/storage/snapshots/index'

export const Route = createFileRoute('/project/$ref/storage/snapshots/')({
  component: StorageSnapshotsIndexRoute,
  staticData: {
    storageLayoutTitle: 'Snapshots',
  },
})

function StorageSnapshotsIndexRoute() {
  return <StorageSnapshotsPage dehydratedState={undefined} />
}
