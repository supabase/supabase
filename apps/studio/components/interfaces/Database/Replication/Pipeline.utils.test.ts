import { describe, expect, test } from 'vitest'

import {
  getPipelineDisplayState,
  getPipelineLogsUrl,
  getRestartRequestStatus,
} from './Pipeline.utils'
import { PipelineStatusName } from './Replication.constants'
import { PipelineStatusRequestStatus } from '@/state/replication-pipeline-request-status'

describe('restart feedback', () => {
  test.each([PipelineStatusName.STARTED, PipelineStatusName.FAILED])(
    'shows Stopping when an active pipeline (%s) restarts',
    (status) => {
      expect(getPipelineDisplayState(getRestartRequestStatus(status), status).label).toBe(
        'Stopping'
      )
    }
  )

  test.each([
    PipelineStatusName.STOPPED,
    PipelineStatusName.STARTING,
    PipelineStatusName.STOPPING,
    PipelineStatusName.UNKNOWN,
    undefined,
  ])('keeps the backend state for %s', (status) => {
    expect(getRestartRequestStatus(status)).toBe(PipelineStatusRequestStatus.None)
    expect(getPipelineDisplayState(getRestartRequestStatus(status), status)).toEqual(
      getPipelineDisplayState(undefined, status)
    )
  })
})

describe('Pipelines logs links', () => {
  test.each(['150', '03dg2o5teb2eucxr9ggh3uie6', 'opaque:id'])(
    'preserves identity %s for both viewers at the canonical URL',
    (pipelineId) => {
      const url = new URL(
        getPipelineLogsUrl({ projectRef: 'project', pipelineId }),
        'http://localhost'
      )
      expect(url.pathname).toBe('/project/project/logs/pipelines-logs')
      expect(url.searchParams.get('filter')).toBe(`pipeline_id:eq:${pipelineId}`)
      expect(JSON.parse(url.searchParams.get('f')!)).toEqual({ pipeline_id: pipelineId })
    }
  )

  test('opens all Pipelines logs from the sidebar', () => {
    expect(getPipelineLogsUrl({ projectRef: 'project' })).toBe(
      '/project/project/logs/pipelines-logs'
    )
  })
})
