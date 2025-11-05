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
