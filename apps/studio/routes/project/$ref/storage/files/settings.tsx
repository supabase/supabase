import { createFileRoute } from '@tanstack/react-router'

import FilesSettingsPage from '@/pages/project/[ref]/storage/files/settings'

export const Route = createFileRoute('/project/$ref/storage/files/settings')({
  component: StorageFilesSettingsRoute,
  staticData: {
    storageLayoutTitle: 'Settings',
  },
})

function StorageFilesSettingsRoute() {
  return <FilesSettingsPage dehydratedState={undefined} />
}
