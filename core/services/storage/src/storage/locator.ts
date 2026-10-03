import { withOptionalVersion } from '@storage/backend'

export interface StorageObjectLocator {
  getRootLocation(): string
  getKeyLocation(params: {
    tenantId: string
    bucketId: string
    objectName: string
    version?: string
  }): string
}

export class TenantLocation implements StorageObjectLocator {
  constructor(protected readonly internalBucket: string) {}

  getRootLocation(): string {
    return this.internalBucket
  }

  getKeyLocation(params: {
    tenantId: string
    bucketId: string
    objectName: string
    version?: string
  }) {
    const key = `${params.tenantId}/${params.bucketId}/${withOptionalVersion(
      params.objectName,
      params.version
    )}`

    return key
  }
}

export class PassThroughLocation implements StorageObjectLocator {
  constructor(protected readonly internalBucket: string) {}

  getRootLocation(): string {
    return this.internalBucket
  }
  getKeyLocation(params: {
    tenantId: string
    bucketId: string
    objectName: string
    version?: string
  }) {
    return params.objectName
  }
}
