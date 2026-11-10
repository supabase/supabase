import { describe, expect, it } from 'vitest'

import { generateDefaultValues } from '../DestinationPanel/DestinationForm/DestinationForm.utils'
import { getDataValidationIssues } from './PipelineDataValidation.utils'
import type { ReplicationPublicationData } from '@/data/replication/publication-query'

const data = {
  ...generateDefaultValues({ catalogToken: '', editMode: false }),
  publicationName: 'analytics',
}
const publication: ReplicationPublicationData = {
  name: 'analytics',
  config: { type: 'tables', tables: [], operations: ['insert'], publish_via_partition_root: false },
  tables: [{ id: 1, name: 'orders', schema: 'public', kind: 'table', partition_parent_id: null }],
}

describe('getDataValidationIssues', () => {
  it.each(['include_all_tables', 'skip_all_tables'] as const)(
    'accepts %s without a table selection',
    (tableSyncCopyMode) => {
      expect(
        getDataValidationIssues({ ...data, tableSyncCopyMode }, 'BigQuery', publication)
      ).toEqual([])
    }
  )
  it.each(['include_tables', 'skip_tables'] as const)(
    'requires current tables for %s',
    (tableSyncCopyMode) => {
      expect(
        getDataValidationIssues(
          { ...data, tableSyncCopyMode, tableSyncCopyTableIds: ['1'] },
          'BigQuery',
          publication
        )
      ).toEqual([])
      for (const tableSyncCopyTableIds of [[], ['bad'], ['42']]) {
        expect(
          getDataValidationIssues(
            { ...data, tableSyncCopyMode, tableSyncCopyTableIds },
            'BigQuery',
            publication
          )
        ).toEqual([expect.objectContaining({ path: 'tableSyncCopyTableIds' })])
      }
    }
  )
  it('rejects unavailable or mismatched publications and invalid advanced settings', () => {
    expect(getDataValidationIssues(data, 'BigQuery')).toEqual([
      expect.objectContaining({ path: 'publicationName' }),
    ])
    expect(
      getDataValidationIssues(data, 'BigQuery', { ...publication, name: 'other' })
    ).toHaveLength(1)
    for (const path of [
      'maxFillMs',
      'maxTableSyncWorkers',
      'maxCopyConnectionsPerTable',
    ] as const) {
      expect(getDataValidationIssues({ ...data, [path]: -1 }, 'Snowflake', publication)).toEqual([
        expect.objectContaining({ path }),
      ])
    }
  })
  it('validates BigQuery table layouts only for BigQuery', () => {
    const invalidLayout = {
      ...data,
      tableOptions: [{ tableId: 1, partitionBy: { kind: 'time_column' as const, column: '' } }],
    }
    expect(getDataValidationIssues(invalidLayout, 'BigQuery', publication)).toEqual([
      expect.objectContaining({ path: 'tableOptions.0.partitionBy.column' }),
    ])
    expect(getDataValidationIssues(invalidLayout, 'Snowflake', publication)).toEqual([])
  })
})
