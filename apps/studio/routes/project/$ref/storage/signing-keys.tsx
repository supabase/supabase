import { createFileRoute } from '@tanstack/react-router'

import { UrlSigningKeys } from '@/components/interfaces/Storage/UrlSigningKeys/UrlSigningKeys'

export const Route = createFileRoute('/project/$ref/storage/signing-keys')({
  component: UrlSigningKeys,
  staticData: {
    storageLayoutTitle: 'URL Signing Keys',
  },
})
