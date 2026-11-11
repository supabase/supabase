import { describe, expect, it } from 'vitest'

import { generateDefaultValues } from '../DestinationPanel/DestinationForm/DestinationForm.utils'
import {
  getConnectionFieldNames,
  getConnectionValidationIssues,
} from './PipelineConnectionValidation.utils'

const validData = {
  ...generateDefaultValues({ catalogToken: '', editMode: false }),
  name: 'Warehouse',
  projectId: 'project',
  datasetId: 'dataset',
  serviceAccountKey: '{}',
  ducklakeMode: 'custom' as const,
  ducklakeCatalogUrl: 'postgresql://user:password@host/catalog',
  ducklakeDataPath: 's3://bucket/data',
  ducklakeS3AccessKeyId: 'key',
  ducklakeS3SecretAccessKey: 'secret',
  ducklakeS3Region: 'us-east-1',
  ducklakeS3Endpoint: 's3.us-east-1.amazonaws.com',
  snowflakeAccountId: 'account',
  snowflakeUser: 'user',
  snowflakePrivateKey: '-----BEGIN PRIVATE KEY-----\nkey\n-----END PRIVATE KEY-----',
  snowflakeDatabase: 'database',
  snowflakeSchema: 'PUBLIC',
  clickhouseUrl: 'https://host:8443',
  clickhouseUser: 'default',
  clickhousePassword: 'password',
  clickhouseDatabase: 'database',
}

describe('connection validation', () => {
  it.each(['BigQuery', 'DuckLake', 'Snowflake', 'ClickHouse'] as const)(
    'validates %s independently of unfilled data fields and other destinations',
    (type) => {
      expect(getConnectionValidationIssues(type, validData)).toEqual([])
      expect(getConnectionValidationIssues(type, { ...validData, name: ' ' })).toContainEqual({
        path: 'name',
        message: 'Name is required.',
      })
      const fields = getConnectionFieldNames(type)
      expect(fields).toContain('name')
      expect(fields).not.toContain('publicationName')
      expect(fields).not.toContain('tableOptions')
    }
  )

  it.each([
    ['BigQuery', { serviceAccountKey: 'invalid' }, 'serviceAccountKey'],
    ['DuckLake', { ducklakeCatalogUrl: '' }, 'ducklakeCatalogUrl'],
    ['Snowflake', { snowflakePrivateKey: 'invalid' }, 'snowflakePrivateKey'],
    ['ClickHouse', { clickhouseUrl: '' }, 'clickhouseUrl'],
  ] as const)('rejects invalid %s connection settings (%s)', (type, changes, path) => {
    expect(getConnectionValidationIssues(type, { ...validData, ...changes })).toEqual(
      expect.arrayContaining([expect.objectContaining({ path })])
    )
  })
})
