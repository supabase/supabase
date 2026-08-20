import { describe, expect, it } from 'vitest'

import type { DestinationPanelSchemaType } from '../DestinationPanel/DestinationForm/DestinationForm.schema'
import { DUCKLAKE_MODE_CUSTOM } from '../DestinationPanel/DestinationForm/DuckLake/DuckLake.constants'
import {
  getCreatePipelineHref,
  getDestinationSetupDocsUrl,
  getFirstEnabledPipelineType,
  getPipelineCreateConnectionStepFieldNames,
  getPipelineCreateStepDocsUrl,
  getPipelineCreateStepHeader,
  hasValidConnection,
  hasValidDataStep,
  mergeFormValuesForDestinationTypeChange,
  PIPELINE_PUBLICATION_DOCS_URL,
} from './CreatePipelineWizard.utils'
import { DOCS_URL } from '@/lib/constants'

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

describe('getDestinationSetupDocsUrl', () => {
  it('uses the BigQuery destination guide when BigQuery is selected', () => {
    expect(getDestinationSetupDocsUrl('BigQuery')).toBe(
      `${DOCS_URL}/guides/database/replication/bigquery#configure-bigquery-as-a-destination`
    )
  })

  it('uses the generic destination setup guide otherwise', () => {
    expect(getDestinationSetupDocsUrl('Snowflake')).toBe(
      `${DOCS_URL}/guides/database/replication/pipelines#step-3-configure-a-destination`
    )
  })
})

describe('getPipelineCreateStepDocsUrl', () => {
  it('returns destination setup docs on the connection step', () => {
    expect(getPipelineCreateStepDocsUrl('connection', 'BigQuery')).toBe(
      getDestinationSetupDocsUrl('BigQuery')
    )
  })

  it('returns publication docs on the data step', () => {
    expect(getPipelineCreateStepDocsUrl('data')).toBe(PIPELINE_PUBLICATION_DOCS_URL)
  })

  it('returns null on destination and review', () => {
    expect(getPipelineCreateStepDocsUrl('destination')).toBeNull()
    expect(getPipelineCreateStepDocsUrl('review')).toBeNull()
  })
})

describe('getPipelineCreateConnectionStepFieldNames', () => {
  it('returns BigQuery connection fields', () => {
    expect(getPipelineCreateConnectionStepFieldNames('BigQuery')).toEqual([
      'name',
      'projectId',
      'datasetId',
      'serviceAccountKey',
    ])
  })
})

describe('getPipelineCreateStepHeader', () => {
  it('fills the destination name into the connection description', () => {
    expect(getPipelineCreateStepHeader('connection', { destinationType: 'BigQuery' })).toEqual({
      title: 'Authorize the destination',
      description: 'Name this pipeline and enter credentials for BigQuery.',
    })
  })

  it('returns static copy for other steps', () => {
    expect(getPipelineCreateStepHeader('review')).toEqual({
      title: 'Review and create',
      description: 'Check these details, then create and start the pipeline.',
    })
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

  it('rejects invalid JSON in the BigQuery service account key', () => {
    expect(
      hasValidConnection({
        type: 'BigQuery',
        data: {
          ...emptyForm,
          name: 'Production analytics',
          projectId: 'example-project',
          datasetId: 'analytics',
          serviceAccountKey: '{ invalid',
        },
      })
    ).toBe(false)
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

describe('mergeFormValuesForDestinationTypeChange', () => {
  it('keeps pipeline-wide fields and resets destination-specific credentials', () => {
    const defaults = {
      ...emptyForm,
      name: '',
      projectId: '',
      datasetId: '',
      serviceAccountKey: '',
      ducklakeCatalogUrl: '',
      ducklakeDataPath: '',
      publicationName: 'analytics',
      tableSyncCopyMode: 'include_all_tables',
      tableSyncCopyTableIds: [],
    } as DestinationPanelSchemaType

    const current = {
      ...defaults,
      name: 'My pipeline',
      projectId: 'gcp-project',
      datasetId: 'dataset',
      serviceAccountKey: '{"type":"service_account"}',
      publicationName: 'events',
      tableSyncCopyMode: 'include_tables',
      tableSyncCopyTableIds: ['1', '2'],
    } as DestinationPanelSchemaType

    const merged = mergeFormValuesForDestinationTypeChange(current, defaults)

    expect(merged.name).toBe('My pipeline')
    expect(merged.publicationName).toBe('events')
    expect(merged.tableSyncCopyMode).toBe('include_tables')
    expect(merged.tableSyncCopyTableIds).toEqual(['1', '2'])
    expect(merged.projectId).toBe('')
    expect(merged.datasetId).toBe('')
    expect(merged.serviceAccountKey).toBe('')
  })
})
