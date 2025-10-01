import dayjs from 'dayjs'
import { Activity, Clock, HelpCircle, Loader2, XCircle } from 'lucide-react'

import { ReplicationPipelineStatusData } from 'data/replication/pipeline-status-query'
import { formatBytes } from 'lib/helpers'
import { PipelineStatusRequestStatus } from 'state/replication-pipeline-request-status'
import { Badge } from 'ui'
import { getPipelineStateMessages } from '../Pipeline.utils'
import { RetryPolicy, TableState } from './ReplicationPipelineStatus.types'

const numberFormatter = new Intl.NumberFormat()

export const getStatusConfig = (state: TableState['state']) => {
  switch (state.name) {
    case 'queued':
      return {
        badge: <Badge variant="warning">Queued</Badge>,
        description: 'Table is waiting for ETL to pick it up for replication.',
        tooltip: 'Table is waiting for ETL to pick it up for replication.',
        color: 'text-warning',
      }
    case 'copying_table':
      return {
        badge: <Badge variant="brand">Copying</Badge>,
        description: "Table's existing rows are being copied before live streaming begins.",
        tooltip: "Table's existing rows are being copied before live streaming begins.",
        color: 'text-brand-600',
      }
    case 'copied_table':
      return {
        badge: <Badge variant="success">Copied</Badge>,
        description: "Table copy is complete and it's preparing to follow WAL changes.",
        tooltip: "Table copy is complete and it's preparing to follow WAL changes.",
        color: 'text-success-600',
      }
    case 'following_wal':
      return {
        badge: <Badge variant="success">Live</Badge>,
        description: 'Table is streaming new changes in real time from the WAL.',
        tooltip: 'Table is streaming new changes in real time from the WAL.',
        color: 'text-success-600',
      }
    case 'error':
      return {
        badge: <Badge variant="destructive">Error</Badge>,
        description: 'Replication is paused because the table encountered an error.',
        tooltip: 'Replication is paused because the table encountered an error.',
        color: 'text-destructive-600',
      }
    default:
      return {
        badge: <Badge variant="warning">Unknown</Badge>,
        description: 'Table status is unavailable.',
        tooltip: 'Table status is unavailable.',
        color: 'text-warning',
      }
  }
}

export const getDisabledStateConfig = ({
  requestStatus,
  statusName,
}: {
  requestStatus: PipelineStatusRequestStatus
  statusName?: ReplicationPipelineStatusData['status']['name']
}) => {
  const { title, message, badge } = getPipelineStateMessages(requestStatus, statusName)

  // Get icon and colors based on current state
  const isEnabling = requestStatus === PipelineStatusRequestStatus.StartRequested
  const isDisabling = requestStatus === PipelineStatusRequestStatus.StopRequested
  const isRestarting = requestStatus === PipelineStatusRequestStatus.RestartRequested
  const isTransitioning = isEnabling || isDisabling || isRestarting

  const icon = isTransitioning ? (
    <Loader2 className="w-6 h-6 animate-spin" />
  ) : statusName === 'failed' ? (
    <XCircle className="w-6 h-6" />
  ) : statusName === 'starting' ? (
    <Clock className="w-6 h-6" />
  ) : statusName === 'unknown' ? (
    <HelpCircle className="w-6 h-6" />
  ) : (
    <Activity className="w-6 h-6" />
  )

  const colors =
    isEnabling || isRestarting
      ? {
          bg: 'bg-brand-50',
          text: 'text-brand-900',
          subtext: 'text-brand-700',
          iconBg: 'bg-brand-600',
          icon: 'text-white dark:text-black',
        }
      : isDisabling || statusName === 'starting' || statusName === 'unknown'
        ? {
            bg: 'bg-warning-50',
            text: 'text-warning-900',
            subtext: 'text-warning-700',
            iconBg: 'bg-warning-600',
            icon: 'text-white dark:text-black',
          }
        : statusName === 'failed'
          ? {
              bg: 'bg-destructive-50',
              text: 'text-destructive-900',
              subtext: 'text-destructive-700',
              iconBg: 'bg-destructive-600',
              icon: 'text-white dark:text-black',
            }
          : {
              bg: 'bg-surface-100',
              text: 'text-foreground',
              subtext: 'text-foreground-light',
              iconBg: 'bg-foreground-lighter',
              icon: 'text-white dark:text-black',
            }

  return { title, message, badge, icon, colors }
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
    return { display: '—', detail: undefined }
  }

  const decimals = value < 1024 ? 0 : value < 1024 * 1024 ? 1 : 2
  const display = formatBytes(value, decimals)
  const detail = `${numberFormatter.format(value)} bytes`

  return { display, detail }
}

const formatLagDurationValue = (value?: number) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return { display: '—', detail: undefined }
  }

  const sign = value < 0 ? '-' : ''
  const absMilliseconds = Math.abs(value)
  const duration = dayjs.duration(absMilliseconds, 'milliseconds')

  if (absMilliseconds < 1000) {
    return { display: `${value} ms`, detail: undefined }
  }

  const seconds = duration.asSeconds()
  if (seconds < 60) {
    const decimals = seconds >= 10 ? 1 : 2
    return {
      display: `${sign}${seconds.toFixed(decimals)} s`,
      detail: `${numberFormatter.format(value)} ms`,
    }
  }

  const minutes = duration.asMinutes()
  if (minutes < 60) {
    const roundedSeconds = Math.round(seconds)
    return {
      display: `${sign}${minutes.toFixed(minutes >= 10 ? 1 : 2)} min`,
      detail: `${numberFormatter.format(roundedSeconds)} s`,
    }
  }

  const hours = duration.asHours()
  const roundedMinutes = Math.round(minutes)
  return {
    display: `${sign}${hours.toFixed(hours >= 10 ? 1 : 2)} h`,
    detail: `${numberFormatter.format(roundedMinutes)} min`,
  }
}

export const getFormattedLagValue = (type: 'bytes' | 'duration', value?: number) =>
  type === 'bytes' ? formatLagBytesValue(value) : formatLagDurationValue(value)
