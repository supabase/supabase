import { createFileRoute } from '@tanstack/react-router'

import { StorageSettings } from '@/components/interfaces/Storage/StorageSettings/StorageSettings'

export const Route = createFileRoute('/project/$ref/storage/files/settings')({
  component: StorageSettings,
  staticData: {
    storageLayoutTitle: 'Settings',
  },
})
