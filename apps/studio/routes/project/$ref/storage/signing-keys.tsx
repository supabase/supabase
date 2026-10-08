import { createFileRoute } from '@tanstack/react-router'

import StorageSigningKeysPage from '@/pages/project/[ref]/storage/signing-keys'

export const Route = createFileRoute('/project/$ref/storage/signing-keys')({
  component: StorageSigningKeysRoute,
  staticData: {
    storageLayoutTitle: 'URL Signing Keys',
  },
})

function StorageSigningKeysRoute() {
  return <StorageSigningKeysPage dehydratedState={undefined} />
}
