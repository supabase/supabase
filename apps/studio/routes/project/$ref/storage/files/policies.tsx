import { createFileRoute } from '@tanstack/react-router'

import FilesPoliciesPage from '@/pages/project/[ref]/storage/files/policies'

export const Route = createFileRoute('/project/$ref/storage/files/policies')({
  component: StorageFilesPoliciesRoute,
  staticData: {
    storageLayoutTitle: 'Policies',
  },
})

function StorageFilesPoliciesRoute() {
  return <FilesPoliciesPage dehydratedState={undefined} />
}
