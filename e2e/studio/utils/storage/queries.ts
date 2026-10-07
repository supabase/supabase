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

/**
 * Uploads an object to a bucket, creating every folder in its path along the way. Storage has no
 * standalone folders — a folder exists because an object sits under that prefix — so this is how
 * a folder tree gets seeded.
 *
 * @param bucket - Bucket name / id
 * @param objectPath - Path within the bucket, e.g. `reports/2024/q1/seed.txt`
 * @param content - File contents (default: a short placeholder)
 */
export async function uploadObject(
  bucket: string,
  objectPath: string,
  content: string = 'e2e fixture'
): Promise<void> {
  await storageRequest(`/object/${bucket}/${objectPath}`, { method: 'POST', body: content })
}

/**
 * Seeds a bucket with a set of object paths. Creates the bucket first when it does not exist.
 *
 * @param bucket - Bucket name / id
 * @param objectPaths - Paths within the bucket to create
 */
export async function seedBucket(bucket: string, objectPaths: string[]): Promise<void> {
  await createBucket(bucket, false)
  for (const objectPath of objectPaths) {
    await uploadObject(bucket, objectPath)
  }
}
