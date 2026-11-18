import { createFileRoute } from '@tanstack/react-router'

import { FilesBuckets } from '@/components/interfaces/Storage/FilesBuckets'

export const Route = createFileRoute('/project/$ref/storage/files/')({
  component: FilesBuckets,
  staticData: {
    storageLayoutTitle: 'Files',
  },
})
