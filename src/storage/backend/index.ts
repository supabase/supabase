import { getConfig, StorageBackendType } from '../../config'
import { StorageBackendAdapter } from './adapter'
import { FileBackend } from './file'
import { S3Backend, S3ClientOptions } from './s3/adapter'

export * from './adapter'
export * from './file'
export * from './s3'
export * from './secure-path'

const {
  storageS3Region,
  storageS3Endpoint,
  storageS3PrivateAssetEndpoint,
  storageS3ForcePathStyle,
  storageS3ClientTimeout,
} = getConfig()

type ConfigForStorage<Type extends StorageBackendType> = Type extends 's3'
  ? S3ClientOptions
  : undefined

export function createStorageBackend<Type extends StorageBackendType>(
  type: Type,
  config?: ConfigForStorage<Type>
) {
  let storageBackend: StorageBackendAdapter

  if (type === 'file') {
    storageBackend = new FileBackend()
  } else {
    const defaultOptions: S3ClientOptions = {
      region: storageS3Region,
      endpoint: storageS3Endpoint,
      privateAssetEndpoint: storageS3PrivateAssetEndpoint,
      forcePathStyle: storageS3ForcePathStyle,
      socketTimeout: storageS3ClientTimeout,
      ...(config ? config : {}),
    }
    storageBackend = new S3Backend(defaultOptions)
  }

  return storageBackend
}
