import { createFileRoute } from '@tanstack/react-router'

import { UrlSigningKeys } from '@/components/interfaces/Storage/UrlSigningKeys/UrlSigningKeys'

export const Route = createFileRoute('/project/$ref/storage/signing-keys')({
  component: StorageSigningKeysPage,
  staticData: {
    storageLayoutTitle: 'URL Signing Keys',
  },
})

function StorageSigningKeysPage() {
  return <UrlSigningKeys />
}
