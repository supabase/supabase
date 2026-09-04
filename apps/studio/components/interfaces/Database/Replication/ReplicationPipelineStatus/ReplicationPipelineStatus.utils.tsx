import dayjs from 'dayjs'

import { getPipelineDisplayState, normalizePipelineStatusName } from '../Pipeline.utils'
import { PipelineStatusName } from '../Replication.constants'
import type { StateDotVariant } from '../StateDot'
import {
  RetryPolicy,
  SlotLagMetrics,
  SlotWalStatus,
  TableState,
} from './ReplicationPipelineStatus.types'
import { ReplicationPipelineStatusData } from '@/data/replication/pipeline-status-query'
import { formatBytes } from '@/lib/helpers'
import { PipelineStatusRequestStatus } from '@/state/replication-pipeline-request-status'

export const getStatusConfig = (
  state: TableState['state']
): { variant: StateDotVariant; label: string; description: string; isPulsing?: boolean } => {
  switch (state.name) {
    case 'queued':
      return { variant: 'default', label: 'Queued', description: 'Waiting to copy' }
    case 'copying_table':
      return {
        variant: 'default',
        label: 'Copying',
        description: 'Copying existing rows',
        isPulsing: true,
      }
    case 'copied_table':
      return {
        variant: 'default',
        label: 'Copied',
        description: 'Copy finished, about to start streaming',
      }
    case 'following_wal':
      return { variant: 'success', label: 'Live', description: 'Streaming changes as they happen' }
    case 'error':
      return { variant: 'destructive', label: 'Error', description: 'Stopped after an error' }
    default:
      return { variant: 'warning', label: 'Unknown', description: 'Table status is unavailable' }
  }
}

export const getDisabledStateConfig = ({
  requestStatus,
  statusName,
}: {
  requestStatus: PipelineStatusRequestStatus
  statusName?: ReplicationPipelineStatusData['status']['name']
}) => {
  const normalizedStatusName = normalizePipelineStatusName(statusName)
  const displayState = getPipelineDisplayState(requestStatus, normalizedStatusName)
  const { title, message } = displayState

  return { title, message }
}

export const isValidRetryPolicy = (policy: any): policy is RetryPolicy => {
  if (!policy || typeof policy !== 'object' || !policy.policy) return false

  switch (policy.policy) {
    case 'no_retry':
    case 'manual_retry':
      return true
    case 'timed_retry':
      return typeof policy.next_retry === 'string'
    default:
      return false
  }
}

const formatLagBytesValue = (value?: number) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return { display: 'n/a', detail: undefined }
  }

  // Scale to the most readable unit (e.g. "4 GB"). We intentionally don't surface the raw byte
  // count as a detail line, since it's unreadable at GB scale (e.g. "4,294,967,296 bytes").
  const decimals = value < 1024 ? 0 : value < 1024 * 1024 ? 1 : 2
  return { display: formatBytes(value, decimals), detail: undefined }
}

// Scale to a single readable unit (ms, s, min, h) based on size, with no precise sub-line.
const formatLagDurationValue = (value?: number) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return { display: 'n/a', detail: undefined }
  }

  const sign = value < 0 ? '-' : ''
  const absMilliseconds = Math.abs(value)
  const duration = dayjs.duration(absMilliseconds, 'milliseconds')

  if (absMilliseconds < 1000) {
    return { display: `${value} ms`, detail: undefined }
  }

  const seconds = duration.asSeconds()
  if (seconds < 60) {
    return { display: `${sign}${seconds.toFixed(seconds >= 10 ? 1 : 2)} s`, detail: undefined }
  }

  const minutes = duration.asMinutes()
  if (minutes < 60) {
    return { display: `${sign}${minutes.toFixed(minutes >= 10 ? 1 : 2)} min`, detail: undefined }
  }

  const hours = duration.asHours()
  return { display: `${sign}${hours.toFixed(hours >= 10 ? 1 : 2)} h`, detail: undefined }
}

export const getFormattedLagValue = (type: 'bytes' | 'duration', value?: number) =>
  type === 'bytes' ? formatLagBytesValue(value) : formatLagDurationValue(value)

export type LagSeverity = 'normal' | 'warning' | 'critical'

type SlotStatusBadgeVariant = 'success' | 'warning' | 'destructive' | 'default'

interface WalStatusMeta {
  label: string
  variant: SlotStatusBadgeVariant
  severity: LagSeverity
  // Shown in the pipeline-level metrics panel.
  description: string
  // Shown in the per-table inline sync view where the slot belongs to a single table.
}

// Plain-language meaning, color, and severity for each WAL status Postgres can report for a slot.
// `variant` drives the badge color; `severity` drives whether the list view raises a warning icon
// (e.g. "extended" is shown amber as a heads-up but isn't alarming on its own).
export const WAL_STATUS_META: Record<SlotWalStatus, WalStatusMeta> = {
  reserved: {
    label: 'Reserved',
    variant: 'success',
    severity: 'normal',
    description: 'Postgres will keep the WAL for every change until this pipeline sends it.',
  },
  extended: {
    label: 'Extended',
    variant: 'warning',
    severity: 'normal',
    description:
      'The pipeline is behind. Postgres is retaining more WAL than usual, but nothing is discarded yet.',
  },
  unreserved: {
    label: 'Unreserved',
    variant: 'warning',
    severity: 'warning',
    description: 'Postgres may discard WAL this pipeline has not sent yet.',
  },
  lost: {
    label: 'Lost',
    variant: 'destructive',
    severity: 'critical',
    description:
      'Postgres already discarded WAL this pipeline needed. Replication cannot continue from here.',
  },
  unknown: {
    label: 'Unknown',
    variant: 'default',
    severity: 'normal',
    description: 'Postgres did not report a status for this pipeline’s slot.',
  },
}

// Postgres reports no WAL status (restart_lsn is null) as "unknown" too, so fall back to it.
export const getWalStatusMeta = (status?: SlotWalStatus): WalStatusMeta =>
  WAL_STATUS_META[status ?? 'unknown']

export const getWalStatusSeverity = (status?: SlotWalStatus): LagSeverity =>
  getWalStatusMeta(status).severity

// Slot-loss risk from how much of the slot's WAL budget has been consumed, rather than fixed byte
// thresholds: max_slot_wal_keep_size ≈ retained WAL (restart_lsn_bytes) + remaining headroom
// (safe_wal_size_bytes), so the consumed fraction is how close the slot is to the "lost" state.
// A null/absent safe_wal_size_bytes now means unlimited retention, so it carries no budget risk.
export const SLOT_LOSS_WARNING_RATIO = 0.75
export const SLOT_LOSS_CRITICAL_RATIO = 0.9

export const getSlotBudgetSeverity = (
  retainedBytes?: number,
  safeWalSizeBytes?: number | null
): LagSeverity => {
  if (
    typeof retainedBytes !== 'number' ||
    typeof safeWalSizeBytes !== 'number' ||
    !Number.isFinite(retainedBytes) ||
    !Number.isFinite(safeWalSizeBytes)
  ) {
    return 'normal'
  }

  const total = retainedBytes + safeWalSizeBytes
  // Nothing retained and no headroom left: nothing to flag (also avoids a 0/0 division). When the
  // headroom is 0 but WAL is still retained, the ratio is 1 and the slot is correctly critical.
  if (total <= 0) return 'normal'

  const consumedRatio = retainedBytes / total
  if (consumedRatio >= SLOT_LOSS_CRITICAL_RATIO) return 'critical'
  if (consumedRatio >= SLOT_LOSS_WARNING_RATIO) return 'warning'
  return 'normal'
}

const SEVERITY_RANK: Record<LagSeverity, number> = { normal: 0, warning: 1, critical: 2 }

const maxSeverity = (a: LagSeverity, b: LagSeverity): LagSeverity =>
  SEVERITY_RANK[a] >= SEVERITY_RANK[b] ? a : b

// Overall slot health = the worse of the reported WAL status and how close the WAL budget is to
// running out. Used to color/flag the lag value in the destinations list.
export const getSlotHealthSeverity = (slot?: {
  restart_lsn_bytes?: number
  safe_wal_size_bytes?: number | null
  wal_status?: SlotWalStatus
}): LagSeverity => {
  if (!slot) return 'normal'
  return maxSeverity(
    getWalStatusSeverity(slot.wal_status),
    getSlotBudgetSeverity(slot.restart_lsn_bytes, slot.safe_wal_size_bytes)
  )
}

/**
 * Copy for the empty state shown when a pipeline reports no table statuses at all.
 * A pipeline that has tables keeps showing them, even while it is stopped or failed.
 */
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
    return {
      title: 'Pipeline stopped',
      description: 'Start the pipeline to begin replication',
    }
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
  /** Whether the logs are the useful next step for this state. */
  showLogsLink: boolean
}

const COPYING_STATES: TableState['state']['name'][] = ['queued', 'copying_table', 'copied_table']

/**
 * How much of the initial copy is left. A pipeline can be caught up on its ongoing change stream
 * while tables are still copying, so several surfaces need to know this to stay honest.
 */
export const getInitialSyncProgress = (
  tableStatuses: { state: { name: TableState['state']['name'] } }[]
) => {
  const count = (name: TableState['state']['name']) =>
    tableStatuses.filter((table) => table.state.name === name).length

  return {
    // Everything not yet streaming, whatever stage of the initial sync it is at
    syncingCount: tableStatuses.filter((table) => COPYING_STATES.includes(table.state.name)).length,
    copyingCount: count('copying_table'),
    queuedCount: count('queued'),
    totalCount: tableStatuses.length,
  }
}

const plural = (count: number, singular: string, pluralForm = `${singular}s`) =>
  `${count} ${count === 1 ? singular : pluralForm}`

/**
 * One sentence on where an initial sync is up to. Only ever says "copying" about tables that are.
 */
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

  // Running. The only thing left worth calling out is an initial sync that hasn't finished.
  const progress = getInitialSyncProgress(tableStatuses)
  if (progress.syncingCount === 0) return undefined

  return {
    type: 'note',
    title: 'Initial sync is running',
    description: `${getInitialSyncSummary(progress)} Each table starts streaming as its copy finishes.`,
    showLogsLink: false,
  }
}

/**
 * A table's own replication slot, as a short list of phrases for one table cell. Skips anything
 * that carries no signal, such as a zero backlog or a reserved WAL status, so the line only ever
 * says what's worth reading. Connection is skipped on purpose: a copying table's slot is inactive
 * until the copy finishes, so flagging it would look like a fault.
 */
export const getTableSyncLagLabel = (metrics: SlotLagMetrics): string[] => {
  const parts: string[] = []

  const pendingBytes = metrics.confirmed_flush_lsn_bytes
  if (typeof pendingBytes === 'number' && pendingBytes > 0) {
    parts.push(`${formatBytes(pendingBytes, pendingBytes < 1024 ? 0 : 1)} waiting to sync`)
  }

  if (metrics.wal_status === 'unreserved') parts.push('Some changes at risk')
  if (metrics.wal_status === 'lost') parts.push('Some changes lost')

  const replyLag = metrics.reply_time_lag
  if (typeof replyLag === 'number' && replyLag > 0) {
    // Same label as the pipeline health card, so the two read as the same measurement
    parts.push(`Last check-in ${getFormattedLagValue('duration', replyLag).display}`)
  }

  return parts
}
