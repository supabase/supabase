vi.hoisted(() => {
  process.env.TUS_USE_FILE_VERSION_SEPARATOR = 'true'
})

import { describe, expect, it, vi } from 'vitest'
import { UploadId } from './upload-id'

describe('UploadId with TUS_USE_FILE_VERSION_SEPARATOR', () => {
  it('keeps the folders of the object name', () => {
    const uploadId = UploadId.fromString('tenant/bucket/folder/sub/cat.png-$v-version-id')

    expect(uploadId.tenant).toBe('tenant')
    expect(uploadId.bucket).toBe('bucket')
    expect(uploadId.objectName).toBe('folder/sub/cat.png')
    expect(uploadId.version).toBe('version-id')
  })

  it('round-trips an id created for a nested object', () => {
    const id = new UploadId({
      tenant: 'tenant',
      bucket: 'bucket',
      objectName: 'folder/cat.png',
      version: 'version-id',
    }).toString()

    expect(id).toBe('tenant/bucket/folder/cat.png-$v-version-id')

    const parsed = UploadId.fromString(id)
    expect(parsed.objectName).toBe('folder/cat.png')
    expect(parsed.version).toBe('version-id')
  })

  it('parses an object at the bucket root', () => {
    const uploadId = UploadId.fromString('tenant/bucket/cat.png-$v-version-id')

    expect(uploadId.objectName).toBe('cat.png')
    expect(uploadId.version).toBe('version-id')
  })
})
