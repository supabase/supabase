import { snakeCase } from 'lodash'

export const getAnalyticsBucketPublicationName = (bucketId: string) => {
  return `analytics_${snakeCase(bucketId)}_publication`
}

export const getAnalyticsBucketS3KeyName = (bucketId: string) => {
  return `${snakeCase(bucketId)}_keys`
}

export const getAnalyticsBucketFDWName = (bucketId: string) => {
  return `${snakeCase(bucketId)}_fdw`
}

export const getAnalyticsBucketFDWServerName = (bucketId: string) => {
  return `${snakeCase(bucketId)}_fdw_server`
}

export const getNamespaceTableNameFromPostgresTableName = (table: {
  name: string
  schema: string
}) => {
  return `${snakeCase(`${table.schema}.${table.name}`)}_changelog`
}

export const getAnalyticsBucketsDestinationName = (bucketId: string) => {
  return `${snakeCase(bucketId)}_destination`
}
