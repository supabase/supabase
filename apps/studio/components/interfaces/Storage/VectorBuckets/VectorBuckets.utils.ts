import { snakeCase } from 'lodash'

export const getVectorBucketS3KeyName = (bucketId: string) => {
  return `${snakeCase(bucketId)}_keys`
}

export const getVectorBucketFDWSchemaName = (bucketId: string) => {
  return `fdw_vector_${snakeCase(bucketId)}`
}

export const getVectorBucketFDWName = (bucketId: string) => {
  return `${snakeCase(bucketId)}_fdw`
}
