import {
  BearerTokenAuth,
  CatalogAuthType,
  SignV4Auth,
} from '@storage/protocols/iceberg/catalog/rest-catalog-client'
import { getConfig } from '../../../../config'

const { storageS3Region, icebergCatalogToken } = getConfig()

export function getCatalogAuthStrategy(authType: string): CatalogAuthType {
  switch (authType) {
    case 'sigv4':
      return new SignV4Auth({ region: storageS3Region })
    case 'token':
      if (!icebergCatalogToken) {
        throw new Error('Iceberg catalog token is not configured')
      }
      return new BearerTokenAuth({ token: icebergCatalogToken })
    default:
      throw new Error(`Unknown auth type: ${authType}`)
  }
}

export * from './reconciler'
export * from './rest-catalog-client'
export * from './tenant-catalog'
