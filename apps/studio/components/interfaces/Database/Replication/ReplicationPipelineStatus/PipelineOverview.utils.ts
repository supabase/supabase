import { getPipelineDisplayState, normalizePipelineStatusName } from '../Pipeline.utils'
import { PipelineStatusName } from '../Replication.constants'
import { TableState } from './ReplicationPipelineStatus.types'
import { getInitialSyncProgress } from './ReplicationPipelineStatus.utils'
import { ReplicationPipelineStatusData } from '@/data/replication/pipeline-status-query'
import { PipelineStatusRequestStatus } from '@/state/replication-pipeline-request-status'

export const getTableStatusEmptyState = ({
  isDisabled,
  disabledStateConfig,
  statusName,
}: {
  isDisabled: boolean
  disabledStateConfig: { title: string; message: string }
  statusName?: ReplicationPipelineStatusData['status']['name']
}) => {
  if (isDisabled) {
    return { title: disabledStateConfig.title, description: disabledStateConfig.message }
  }

  if (statusName === PipelineStatusName.STOPPED) {
    return { title: 'Pipeline stopped', description: 'Start the pipeline to begin replication' }
  }

  if (statusName === PipelineStatusName.FAILED) {
    return {
      title: 'Pipeline failed',
      description: 'Restart the pipeline or reset your tables to recover',
    }
  }

  return {
    title: 'No table data yet',
    description: 'Table status appears here once replication begins',
  }
}

export interface PipelineStateNotice {
  type: 'note' | 'warning' | 'destructive'
  title: string
  description: string
  showLogsLink: boolean
}

const plural = (count: number, singular: string, pluralForm = `${singular}s`) =>
  `${count} ${count === 1 ? singular : pluralForm}`

export const getInitialSyncSummary = ({
  copyingCount,
  queuedCount,
  totalCount,
}: ReturnType<typeof getInitialSyncProgress>) => {
  if (copyingCount > 0 && queuedCount > 0) {
    return `${copyingCount} of ${plural(totalCount, 'table')} ${copyingCount === 1 ? 'is' : 'are'} copying and ${queuedCount} ${queuedCount === 1 ? 'is' : 'are'} waiting.`
  }
  if (copyingCount > 0) {
    return `${copyingCount} of ${plural(totalCount, 'table')} ${copyingCount === 1 ? 'is' : 'are'} copying.`
  }
  if (queuedCount > 0) {
    return `${plural(queuedCount, 'table')} ${queuedCount === 1 ? 'is' : 'are'} waiting to copy.`
  }
  return 'The last tables are finishing their copy.'
}

export const getPipelineStateNotice = ({
  requestStatus,
  statusName,
  tableStatuses,
}: {
  requestStatus: PipelineStatusRequestStatus
  statusName?: ReplicationPipelineStatusData['status']['name']
  tableStatuses: { state: { name: TableState['state']['name'] } }[]
}): PipelineStateNotice | undefined => {
  const displayState = getPipelineDisplayState(
    requestStatus,
    normalizePipelineStatusName(statusName)
  )

  if (displayState.type === 'loading') {
    return {
      type: 'note',
      title: displayState.title,
      description: displayState.message,
      showLogsLink: false,
    }
  }

  if (displayState.key === 'failed') {
    return {
      type: 'destructive',
      title: displayState.title,
      description:
        'Replication has stopped. Restart the pipeline to resume from its last checkpoint. Table states below are from before it failed.',
      showLogsLink: true,
    }
  }

  if (displayState.key === 'stopped') {
    return {
      type: 'note',
      title: displayState.title,
      description:
        'Changes to your source tables wait in Postgres until you start the pipeline again. Table states below are from before it stopped.',
      showLogsLink: false,
    }
  }

  if (displayState.key === 'unknown') {
    return {
      type: 'warning',
      title: displayState.title,
      description: 'We can’t tell whether replication is running',
      showLogsLink: true,
    }
  }

  const progress = getInitialSyncProgress(tableStatuses)
  if (progress.syncingCount === 0) return undefined

  return {
    type: 'note',
    title: 'Initial sync is running',
    description: `${getInitialSyncSummary(progress)} Each table starts streaming as its copy finishes.`,
    showLogsLink: false,
  }
}
