import { describe, expect, it } from 'vitest'

import type { DestinationPanelSchemaType } from '../DestinationPanel/DestinationForm/DestinationForm.schema'
import { DUCKLAKE_MODE_CUSTOM } from '../DestinationPanel/DestinationForm/DuckLake/DuckLake.constants'
import {
  getAccessiblePipelineCreateStep,
  getCreatePipelineHref,
  getCreatePipelineSubmitLabel,
  getDestinationSetupDocsUrl,
  getFirstEnabledPipelineType,
  getPipelineCreateConnectionStepFieldNames,
  getPipelineCreateConnectionValidationIssues,
  getPipelineCreateStepDocsUrl,
  getPipelineCreateStepHeader,
  hasCreatePipelineUnsavedChanges,
  hasValidConnection,
  hasValidDataStep,
  isCreatePipelineNextDisabled,
  isCreatePipelineSubmitDisabled,
  isPipelineDestinationType,
  mergeFormValuesForDestinationTypeChange,
  PIPELINE_PUBLICATION_DOCS_URL,
} from './CreatePipelineWizard.utils'
import { DOCS_URL } from '@/lib/constants'

const emptyForm = {
  name: '',
  publicationName: '',
  tableSyncCopyMode: 'include_all_tables',
  tableSyncCopyTableIds: [],
} as unknown as DestinationPanelSchemaType

describe('getFirstEnabledPipelineType', () => {
  it('returns the first enabled pipeline type in product order', () => {
    expect(
      getFirstEnabledPipelineType({
        BigQuery: false,
        DuckLake: true,
      })
    ).toBe('DuckLake')
  })

  it('returns null when no pipeline types are enabled', () => {
    expect(getFirstEnabledPipelineType({})).toBeNull()
  })
})

describe('isPipelineDestinationType', () => {
  it('excludes the deprecated Analytics Bucket destination', () => {
    expect(isPipelineDestinationType('Analytics Bucket')).toBe(false)
  })
})

describe('getCreatePipelineHref', () => {
  it('encodes the destination type in the query string', () => {
    expect(getCreatePipelineHref('abc', 'ClickHouse')).toBe(
      '/project/abc/database/pipelines/new?destinationType=ClickHouse'
    )
  })
})

describe('hasCreatePipelineUnsavedChanges', () => {
  it('is dirty when the form is dirty on the first step', () => {
    expect(hasCreatePipelineUnsavedChanges({ isDirty: true, step: 'destination' })).toBe(true)
  })

  it('is dirty after leaving the first step even when the form is pristine', () => {
    expect(hasCreatePipelineUnsavedChanges({ isDirty: false, step: 'connection' })).toBe(true)
  })

  it('is clean on the first step with a pristine form', () => {
    expect(hasCreatePipelineUnsavedChanges({ isDirty: false, step: 'destination' })).toBe(false)
  })
})

describe('getCreatePipelineSubmitLabel', () => {
  it('asks to continue anyway when only warnings remain after validation', () => {
    expect(
      getCreatePipelineSubmitLabel({
        hasRunValidation: true,
        hasCriticalFailures: false,
        warningCount: 2,
      })
    ).toBe('Start pipeline anyway')
  })

  it('uses the default create label otherwise', () => {
    expect(
      getCreatePipelineSubmitLabel({
        hasRunValidation: false,
        hasCriticalFailures: false,
        warningCount: 0,
      })
    ).toBe('Start pipeline')
  })
})

describe('isCreatePipelineSubmitDisabled', () => {
  it('disables submit while publications are missing or unavailable', () => {
    expect(
      isCreatePipelineSubmitDisabled({
        isSaving: false,
        isSuccessPublications: false,
        isSelectedPublicationMissing: false,
        hasNoAvailableDestinations: false,
        isConnectionVerified: true,
        hasValidData: true,
      })
    ).toBe(true)

    expect(
      isCreatePipelineSubmitDisabled({
        isSaving: false,
        isSuccessPublications: true,
        isSelectedPublicationMissing: true,
        hasNoAvailableDestinations: false,
        isConnectionVerified: true,
        hasValidData: true,
      })
    ).toBe(true)
  })

  it('disables submit until the connection and data steps are complete', () => {
    expect(
      isCreatePipelineSubmitDisabled({
        isSaving: false,
        isSuccessPublications: true,
        isSelectedPublicationMissing: false,
        hasNoAvailableDestinations: false,
        isConnectionVerified: false,
        hasValidData: true,
      })
    ).toBe(true)

    expect(
      isCreatePipelineSubmitDisabled({
        isSaving: false,
        isSuccessPublications: true,
        isSelectedPublicationMissing: false,
        hasNoAvailableDestinations: false,
        isConnectionVerified: true,
        hasValidData: false,
      })
    ).toBe(true)
  })

  it('enables submit when all steps are complete', () => {
    expect(
      isCreatePipelineSubmitDisabled({
        isSaving: false,
        isSuccessPublications: true,
        isSelectedPublicationMissing: false,
        hasNoAvailableDestinations: false,
        isConnectionVerified: true,
        hasValidData: true,
      })
    ).toBe(false)
  })
})

describe('getAccessiblePipelineCreateStep', () => {
  it('returns to destination when no destination is selected', () => {
    expect(
      getAccessiblePipelineCreateStep({
        requestedStep: 'review',
        hasDestination: false,
        isConnectionVerified: false,
        hasValidData: false,
      })
    ).toBe('destination')
  })

  it('returns a refreshed review step to connection verification', () => {
    expect(
      getAccessiblePipelineCreateStep({
        requestedStep: 'review',
        hasDestination: true,
        isConnectionVerified: false,
        hasValidData: false,
      })
    ).toBe('connection')
  })

  it('returns review to data when the connection is verified but data is incomplete', () => {
    expect(
      getAccessiblePipelineCreateStep({
        requestedStep: 'review',
        hasDestination: true,
        isConnectionVerified: true,
        hasValidData: false,
      })
    ).toBe('data')
  })

  it('keeps review accessible when every preceding step is complete', () => {
    expect(
      getAccessiblePipelineCreateStep({
        requestedStep: 'review',
        hasDestination: true,
        isConnectionVerified: true,
        hasValidData: true,
      })
    ).toBe('review')
  })
})

describe('isCreatePipelineNextDisabled', () => {
  it('disables destination continuation until a destination is selected', () => {
    expect(
      isCreatePipelineNextDisabled({
        step: 'destination',
        hasDestination: false,
        hasPublicationName: false,
        isPublicationReady: false,
        isSelectedPublicationMissing: false,
      })
    ).toBe(true)
  })

  it('keeps data continuation disabled while the selected publication loads', () => {
    expect(
      isCreatePipelineNextDisabled({
        step: 'data',
        hasDestination: true,
        hasPublicationName: true,
        isPublicationReady: false,
        isSelectedPublicationMissing: false,
      })
    ).toBe(true)
  })

  it('allows an empty publication field to surface form validation', () => {
    expect(
      isCreatePipelineNextDisabled({
        step: 'data',
        hasDestination: true,
        hasPublicationName: false,
        isPublicationReady: false,
        isSelectedPublicationMissing: false,
      })
    ).toBe(false)
  })

  it('enables data continuation once the selected publication is ready', () => {
    expect(
      isCreatePipelineNextDisabled({
        step: 'data',
        hasDestination: true,
        hasPublicationName: true,
        isPublicationReady: true,
        isSelectedPublicationMissing: false,
      })
    ).toBe(false)
  })
})

describe('getDestinationSetupDocsUrl', () => {
  it.each([
    [
      'BigQuery',
      '/guides/database/replication/pipelines/bigquery#configure-bigquery-as-a-destination',
    ],
    [
      'ClickHouse',
      '/guides/database/replication/pipelines/clickhouse#configure-clickhouse-as-a-destination',
    ],
    ['DuckLake', '/guides/database/replication/pipelines/ducklake#choose-a-configuration-mode'],
    ['Snowflake', '/guides/database/replication/pipelines/snowflake#prepare-snowflake-resources'],
  ] as const)('uses the %s destination guide when selected', (destinationType, path) => {
    expect(getDestinationSetupDocsUrl(destinationType)).toBe(`${DOCS_URL}${path}`)
  })

  it('uses the generic setup guide for the deprecated Analytics Bucket destination', () => {
    expect(getDestinationSetupDocsUrl('Analytics Bucket')).toBe(
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
      description: 'Check these details, then start the pipeline.',
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

describe('getPipelineCreateConnectionValidationIssues', () => {
  it('returns every required Snowflake field for an empty connection', () => {
    expect(
      getPipelineCreateConnectionValidationIssues({
        type: 'Snowflake',
        data: emptyForm,
      })
    ).toEqual([
      { path: 'snowflakeAccountId', message: 'Account ID is required.' },
      { path: 'snowflakeUser', message: 'User is required.' },
      { path: 'snowflakePrivateKey', message: 'Private key is required.' },
      { path: 'snowflakeDatabase', message: 'Database is required.' },
      { path: 'snowflakeSchema', message: 'Schema is required.' },
    ])
  })
})

describe('hasValidDataStep', () => {
  const publicationNames = ['analytics']
  const publication = {
    name: 'analytics',
    tables: [{ id: 101, schema: 'public', name: 'orders' }],
  } as any

  it('rejects a missing publication', () => {
    expect(
      hasValidDataStep({
        publicationName: '',
        tableSyncCopyMode: 'include_all_tables',
        tableSyncCopyTableIds: [],
        publicationNames,
        publication,
      })
    ).toBe(false)
  })

  it('rejects a publication that is no longer on the source', () => {
    expect(
      hasValidDataStep({
        publicationName: 'gone',
        tableSyncCopyMode: 'include_all_tables',
        tableSyncCopyTableIds: [],
        publicationNames,
        publication,
      })
    ).toBe(false)
  })

  it('requires at least one selected table in include mode', () => {
    expect(
      hasValidDataStep({
        publicationName: 'analytics',
        tableSyncCopyMode: 'include_tables',
        tableSyncCopyTableIds: [],
        publicationNames,
        publication,
      })
    ).toBe(false)
  })

  it('accepts include-all when the publication exists', () => {
    expect(
      hasValidDataStep({
        publicationName: 'analytics',
        tableSyncCopyMode: 'include_all_tables',
        tableSyncCopyTableIds: [],
        publicationNames,
        publication,
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
