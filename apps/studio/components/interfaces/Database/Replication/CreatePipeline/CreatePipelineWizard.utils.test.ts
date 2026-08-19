import { describe, expect, it } from 'vitest'

import type { DestinationPanelSchemaType } from '../DestinationPanel/DestinationForm/DestinationForm.schema'
import { DUCKLAKE_MODE_CUSTOM } from '../DestinationPanel/DestinationForm/DuckLake/DuckLake.constants'
import {
  getCreatePipelineHref,
  getFirstEnabledPipelineType,
  hasValidConnection,
  hasValidDataStep,
} from './CreatePipelineWizard.utils'

const emptyForm = {
  name: '',
  publicationName: '',
  tableSyncCopyMode: 'include_all_tables',
  tableSyncCopyTableIds: [],
} as DestinationPanelSchemaType

describe('getFirstEnabledPipelineType', () => {
  it('returns the first enabled pipeline type in product order', () => {
    expect(
      getFirstEnabledPipelineType({
        BigQuery: false,
        'Analytics Bucket': true,
        DuckLake: true,
      })
    ).toBe('Analytics Bucket')
  })

  it('returns null when no pipeline types are enabled', () => {
    expect(getFirstEnabledPipelineType({})).toBeNull()
  })
})

describe('getCreatePipelineHref', () => {
  it('encodes the destination type in the query string', () => {
    expect(getCreatePipelineHref('abc', 'Analytics Bucket')).toBe(
      '/project/abc/database/replication/new?destinationType=Analytics%20Bucket'
    )
  })
})

describe('hasValidConnection', () => {
  it('rejects a missing pipeline name', () => {
    expect(
      hasValidConnection({
        type: 'BigQuery',
        data: {
          ...emptyForm,
          projectId: 'example-project',
          datasetId: 'analytics',
          serviceAccountKey: '{"type":"service_account"}',
        },
      })
    ).toBe(false)
  })

  it('accepts complete BigQuery credentials', () => {
    expect(
      hasValidConnection({
        type: 'BigQuery',
        data: {
          ...emptyForm,
          name: 'Production analytics',
          projectId: 'example-project',
          datasetId: 'analytics',
          serviceAccountKey: '{"type":"service_account"}',
        },
      })
    ).toBe(true)
  })

  it('rejects incomplete ClickHouse settings', () => {
    expect(
      hasValidConnection({
        type: 'ClickHouse',
        data: {
          ...emptyForm,
          name: 'Events',
          clickhouseUrl: 'https://example.clickhouse.cloud',
        },
      })
    ).toBe(false)
  })

  it('accepts a DuckLake custom configuration', () => {
    expect(
      hasValidConnection({
        type: 'DuckLake',
        data: {
          ...emptyForm,
          name: 'Lakehouse',
          ducklakeMode: DUCKLAKE_MODE_CUSTOM,
          ducklakeCatalogUrl: 'postgres://catalog.example',
          ducklakeDataPath: 's3://bucket/path',
          ducklakeS3AccessKeyId: 'AKIA',
          ducklakeS3SecretAccessKey: 'secret',
          ducklakeS3Region: 'us-east-1',
          ducklakeS3Endpoint: 's3.example.com',
        },
      })
    ).toBe(true)
  })
})

describe('hasValidDataStep', () => {
  const publications = [
    {
      name: 'analytics',
      tables: [{ id: 101, schema: 'public', name: 'orders' }],
    },
  ]

  it('rejects a missing publication', () => {
    expect(
      hasValidDataStep({
        publicationName: '',
        tableSyncCopyMode: 'include_all_tables',
        tableSyncCopyTableIds: [],
        publications,
      })
    ).toBe(false)
  })

  it('rejects a publication that is no longer on the source', () => {
    expect(
      hasValidDataStep({
        publicationName: 'gone',
        tableSyncCopyMode: 'include_all_tables',
        tableSyncCopyTableIds: [],
        publications,
      })
    ).toBe(false)
  })

  it('requires at least one selected table in include mode', () => {
    expect(
      hasValidDataStep({
        publicationName: 'analytics',
        tableSyncCopyMode: 'include_tables',
        tableSyncCopyTableIds: [],
        publications,
      })
    ).toBe(false)
  })

  it('accepts include-all when the publication exists', () => {
    expect(
      hasValidDataStep({
        publicationName: 'analytics',
        tableSyncCopyMode: 'include_all_tables',
        tableSyncCopyTableIds: [],
        publications,
      })
    ).toBe(true)
  })
})
