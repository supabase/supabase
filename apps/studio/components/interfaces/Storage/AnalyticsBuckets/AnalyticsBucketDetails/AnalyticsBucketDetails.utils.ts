import { snakeCase } from 'lodash'

export const getAnalyticsBucketS3KeyName = (bucketId: string) => {
  return `${snakeCase(bucketId)}_keys`
}

export const getAnalyticsBucketFDWServerName = (bucketId: string) => {
  return `${snakeCase(bucketId)}_fdw_server`
}
