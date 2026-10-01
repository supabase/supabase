import { listBucketObjects } from './bucket-objects-list-mutation'

const DEFAULT_INTERVAL_MS = 3000
const DEFAULT_MAX_ATTEMPTS = 60

export async function pollUntilBucketEmpty({
  projectRef,
  bucketId,
}: {
  projectRef: string
  bucketId: string
}): Promise<void> {
  for (let attempt = 0; attempt < DEFAULT_MAX_ATTEMPTS; attempt++) {
    const objects = await listBucketObjects({
      projectRef,
      bucketId,
      path: '',
      options: {
        limit: 10,
      },
    })

    if (objects.length === 0) {
      return
    }

    await new Promise((resolve) => setTimeout(resolve, DEFAULT_INTERVAL_MS))
  }

  throw new Error('Failed to empty bucket. Please try again in a few minutes.')
}
