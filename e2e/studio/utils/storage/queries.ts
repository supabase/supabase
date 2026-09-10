import { storageRequest } from './client.js'

interface Bucket {
  id: string
  name: string
  public: boolean
}

/**
 * List all storage buckets.
 */
export async function listBuckets(): Promise<Bucket[]> {
  return storageRequest<Bucket[]>('/bucket')
}

/**
 * Create a storage bucket. Idempotent — skips creation if the bucket already exists.
 *
 * @param name - Bucket name / id
 * @param isPublic - Whether the bucket should be public (default: false)
 */
export async function createBucket(name: string, isPublic: boolean = false): Promise<void> {
  const buckets = await listBuckets()
  if (buckets.some((b) => b.id === name)) return

  await storageRequest('/bucket', {
    method: 'POST',
    body: { id: name, name, public: isPublic },
  })
}

/**
 * Delete a storage bucket. Idempotent — empties the bucket first, then deletes it.
 * No-ops if the bucket does not exist.
 *
 * @param name - Bucket name / id
 */
export async function deleteBucket(name: string): Promise<void> {
  const buckets = await listBuckets()
  if (!buckets.some((b) => b.id === name)) return

  await storageRequest(`/bucket/${name}/empty`, { method: 'POST' })
  await storageRequest(`/bucket/${name}`, { method: 'DELETE' })
}

/**
 * Delete every storage bucket.
 */
export async function deleteAllBuckets(): Promise<void> {
  const buckets = await listBuckets()
  for (const bucket of buckets) {
    await deleteBucket(bucket.id)
  }
}
