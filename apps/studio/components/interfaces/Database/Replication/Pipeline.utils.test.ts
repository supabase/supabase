import { describe, expect, test } from 'vitest'

import {
  getPipelineDisplayState,
  getPipelineLegacyLogsUrl,
  getPipelineUnifiedLogsUrl,
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
    'filters unified logs to Pipelines and pipeline %s',
    (pipelineId) => {
      const url = new URL(
        getPipelineUnifiedLogsUrl({ projectRef: 'project', pipelineId }),
        'http://localhost'
      )
      expect(url.pathname).toBe('/project/project/logs')
      expect(url.searchParams.get('filter')).toBe(
        `log_type:eq:pipelines,pipeline_id:eq:${pipelineId}`
      )
    }
  )

  test('filters unified logs to Pipelines without a pipeline', () => {
    const url = new URL(getPipelineUnifiedLogsUrl({ projectRef: 'project' }), 'http://localhost')
    expect(url.searchParams.get('filter')).toBe('log_type:eq:pipelines')
  })

  test.each(['150', '03dg2o5teb2eucxr9ggh3uie6'])(
    'filters the legacy collection to pipeline %s',
    (pipelineId) => {
      const url = new URL(
        getPipelineLegacyLogsUrl({ projectRef: 'project', pipelineId }),
        'http://localhost'
      )
      expect(url.pathname).toBe('/project/project/logs/pipelines-logs')
      expect(JSON.parse(url.searchParams.get('f')!)).toEqual({ pipeline_id: pipelineId })
    }
  )

  test('opens the full legacy collection without a pipeline', () => {
    expect(getPipelineLegacyLogsUrl({ projectRef: 'project' })).toBe(
      '/project/project/logs/pipelines-logs'
    )
  })
})
