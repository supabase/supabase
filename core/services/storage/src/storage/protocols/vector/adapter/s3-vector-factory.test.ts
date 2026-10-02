import { S3VectorsClient } from '@aws-sdk/client-s3vectors'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const config = vi.hoisted(() => ({
  storageS3Region: undefined as string | undefined,
  vectorBucketRegion: undefined as string | undefined,
}))

vi.mock('../../../../config', () => ({
  getConfig: () => config,
}))

vi.mock('@aws-sdk/client-s3vectors', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@aws-sdk/client-s3vectors')>()),
  S3VectorsClient: vi.fn(),
}))

describe('createS3VectorClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it.each([
    {
      name: 'prefers the vector bucket region',
      configured: { storageS3Region: 'us-east-1', vectorBucketRegion: 'eu-west-1' },
      expectedRegion: 'eu-west-1',
    },
    {
      name: 'falls back to the storage S3 region',
      configured: { storageS3Region: 'sa-east-1', vectorBucketRegion: undefined },
      expectedRegion: 'sa-east-1',
    },
  ])('$name', async ({ configured, expectedRegion }) => {
    Object.assign(config, configured)
    const { createS3VectorClient } = await import('./s3-vector')
    const client = createS3VectorClient()
    const Client = vi.mocked(S3VectorsClient)

    expect(Client).toHaveBeenCalledOnce()
    expect(Client).toHaveBeenCalledWith({ region: expectedRegion })
    expect(client).toBe(Client.mock.instances[0])
  })
})
