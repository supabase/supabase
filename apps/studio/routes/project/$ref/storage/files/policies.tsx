import { createFileRoute } from '@tanstack/react-router'

import { StoragePolicies } from '@/components/interfaces/Storage/StoragePolicies/StoragePolicies'

export const Route = createFileRoute('/project/$ref/storage/files/policies')({
  component: StoragePolicies,
  staticData: {
    storageLayoutTitle: 'Policies',
  },
})
