import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'

import { getPipelineDisplayState, normalizePipelineStatusName } from '../Pipeline.utils'
import {
  RetryPolicy,
  SlotLagMetrics,
  SlotWalStatus,
  TableState,
} from './ReplicationPipelineStatus.types'
import type { StateDotVariant } from '@/components/ui/StateDot'
import { ReplicationPipelineStatusData } from '@/data/replication/pipeline-status-query'
import { formatBytes } from '@/lib/helpers'
import { PipelineStatusRequestStatus } from '@/state/replication-pipeline-request-status'

dayjs.extend(duration)

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

const formatLagBytesValue = (value?: number | null) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return { display: 'Unavailable', detail: undefined }
  }

  // Scale to the most readable unit (e.g. "4 GB"). We intentionally don't surface the raw byte
  // count as a detail line, since it's unreadable at GB scale (e.g. "4,294,967,296 bytes").
  const decimals = value < 1024 ? 0 : value < 1024 * 1024 ? 1 : 2
  return { display: formatBytes(value, decimals), detail: undefined }
}

// Scale to a single readable unit (ms, s, min, h) based on size, with no precise sub-line.
const formatLagDurationValue = (value?: number | null) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return { display: 'Unavailable', detail: undefined }
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

export const getFormattedLagValue = (type: 'bytes' | 'duration', value?: number | null) =>
  type === 'bytes' ? formatLagBytesValue(value) : formatLagDurationValue(value)

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

export type LagSeverity = 'normal' | 'warning' | 'critical'

type SlotStatusBadgeVariant = 'success' | 'warning' | 'destructive' | 'default'

interface WalStatusMeta {
  label: string
  variant: SlotStatusBadgeVariant
  severity: LagSeverity
  // Shown in the pipeline-level metrics panel.
  description: string
  // Shown in the per-table inline sync view where the slot belongs to a single table.
  tableDescription: string
}

// Plain-language meaning, color, and severity for each WAL status Postgres can report for a slot.
// `variant` drives the badge color; `severity` drives whether the list view raises a warning icon
// (e.g. "extended" is shown amber as a heads-up but isn't alarming on its own).
export const WAL_STATUS_META: Record<SlotWalStatus, WalStatusMeta> = {
  reserved: {
    label: 'Reserved',
    variant: 'success',
    severity: 'normal',
    description: 'Postgres is retaining the WAL this slot needs within the normal WAL size limit.',
    tableDescription:
      "Healthy. Your database is keeping the WAL files this table's replication slot needs, and they are within the normal WAL size limit.",
  },
  extended: {
    label: 'Extended',
    variant: 'warning',
    severity: 'normal',
    description:
      'Postgres is retaining WAL beyond the normal size limit, and the slot’s required changes are still available.',
    tableDescription:
      "Available. This table's slot needs WAL beyond the normal size limit, and Postgres is still retaining it.",
  },
  unreserved: {
    label: 'Unreserved',
    variant: 'warning',
    severity: 'warning',
    description: 'Postgres may remove WAL this replication slot still needs.',
    tableDescription:
      "At risk. Your database is no longer reserving all WAL files this table's replication slot needs. If the pipeline does not catch up soon, those files may be removed.",
  },
  lost: {
    label: 'Lost',
    variant: 'destructive',
    severity: 'critical',
    description:
      'Postgres already discarded WAL this pipeline needed. Replication cannot continue from here.',
    tableDescription:
      "Broken. Some WAL files this table's replication slot needs have already been removed. The pipeline can no longer continue from this slot. You can recreate a new pipeline, or set the invalidation behavior to recreate and restart the pipeline.",
  },
  unknown: {
    label: 'Unknown',
    variant: 'default',
    severity: 'normal',
    description: 'Postgres did not report a recognized status for this pipeline’s slot.',
    tableDescription:
      "Unknown. Your database reported an unknown state for this table's replication slot.",
  },
}

// Postgres reports no WAL status (restart_lsn is null) as "unknown" too, so fall back to it.
export const getWalStatusMeta = (status?: SlotWalStatus | null): WalStatusMeta =>
  WAL_STATUS_META[status ?? 'unknown']

// Legend entries from healthiest to most severe, ending with the unknown/unavailable case.
export const WAL_STATUS_LEGEND: WalStatusMeta[] = [
  WAL_STATUS_META.reserved,
  WAL_STATUS_META.extended,
  WAL_STATUS_META.unreserved,
  WAL_STATUS_META.lost,
  WAL_STATUS_META.unknown,
]

export const getWalStatusSeverity = (status?: SlotWalStatus | null): LagSeverity =>
  getWalStatusMeta(status).severity

// Slot-loss risk from how much of the slot's WAL budget has been consumed, rather than fixed byte
// thresholds: max_slot_wal_keep_size ≈ retained WAL (restart_lsn_bytes) + remaining headroom
// (safe_wal_size_bytes), so the consumed fraction is how close the slot is to the "lost" state.
// Missing headroom alone cannot establish whether retention is unlimited or unavailable.
export const SLOT_LOSS_WARNING_RATIO = 0.75
export const SLOT_LOSS_CRITICAL_RATIO = 0.9

export const getSlotBudgetSeverity = (
  retainedBytes?: number | null,
  safeWalSizeBytes?: number | null
): LagSeverity => {
  if (typeof safeWalSizeBytes !== 'number' || !Number.isFinite(safeWalSizeBytes)) return 'normal'
  if (safeWalSizeBytes <= 0) return 'critical'

  if (typeof retainedBytes !== 'number' || !Number.isFinite(retainedBytes)) {
    return 'normal'
  }

  const total = retainedBytes + safeWalSizeBytes
  // A positive budget is needed to calculate its consumed fraction.
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
  restart_lsn_bytes?: number | null
  safe_wal_size_bytes?: number | null
  wal_status?: SlotWalStatus | null
}): LagSeverity => {
  if (!slot) return 'normal'
  return maxSeverity(
    getWalStatusSeverity(slot.wal_status),
    getSlotBudgetSeverity(slot.restart_lsn_bytes, slot.safe_wal_size_bytes)
  )
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
    parts.push(`${formatBytes(pendingBytes, pendingBytes < 1024 ? 0 : 1)} WAL backlog`)
  } else if (pendingBytes == null) {
    parts.push('Lag unavailable')
  }

  const safeWalSizeBytes = metrics.safe_wal_size_bytes
  if (typeof safeWalSizeBytes === 'number' && Number.isFinite(safeWalSizeBytes)) {
    if (safeWalSizeBytes < 0) {
      parts.push('WAL retention budget exceeded')
    } else {
      const formattedBytes = formatBytes(safeWalSizeBytes, safeWalSizeBytes < 1024 ? 0 : 1)
      parts.push(`${formattedBytes} WAL retention remaining`)
    }
  }

  if (metrics.wal_status === 'unreserved') parts.push('Some changes at risk')
  if (metrics.wal_status === 'lost') parts.push('Some changes lost')

  const replyLag = metrics.reply_time_lag
  if (typeof replyLag === 'number' && replyLag > 0) {
    parts.push(`Last check-in ${getFormattedLagValue('duration', replyLag).display}`)
  }

  return parts
}
