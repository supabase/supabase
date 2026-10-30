import dayjs from 'dayjs'
import { type ReactNode } from 'react'

import { SlotLagMetricKey } from './ReplicationPipelineStatus.types'
import { getFormattedLagValue } from './ReplicationPipelineStatus.utils'

export interface SlotLagField {
  key: SlotLagMetricKey
  label: string
  type: 'bytes' | 'duration'
  description: ReactNode
  // Friendly label to show in place of a literal "0 bytes" when there's nothing to report.
  zeroLabel?: string
  // Optional hover text for the value, derived from the raw value (e.g. an absolute timestamp).
  getValueTooltip?: (value: number) => string
}

export const SLOT_LAG_FIELDS: SlotLagField[] = [
  {
    key: 'confirmed_flush_lsn_bytes',
    label: 'Lag',
    type: 'bytes',
    description:
      'WAL available for replication but not yet acknowledged on the pipeline’s main slot, including unrelated database activity; initial sync progress is shown separately.',
    // A zero confirmed_flush_lsn_bytes means ongoing replication is caught up.
    // Initial table copies use separate slots.
    zeroLabel: 'Caught up',
  },
  {
    key: 'safe_wal_size_bytes',
    label: 'WAL retention remaining',
    type: 'bytes',
    description: 'How much more WAL can accumulate before the slot risks losing changes.',
  },
  {
    key: 'reply_time_lag',
    label: 'Last check-in',
    type: 'duration',
    description: 'Time since the pipeline last checked in with the source database.',
    zeroLabel: 'Just now',
    // reply_time_lag is "milliseconds ago", so the absolute time is now minus that, in local time.
    getValueTooltip: (ms) => dayjs().subtract(ms, 'millisecond').format('MMM D, YYYY, h:mm:ss A'),
  },
]

// Resolves a field's value into a display string (+ optional precise detail), honoring the
// friendly zero labels before falling back to the formatted byte/duration value.
export const getFieldDisplay = (field: SlotLagField, value: number | null | undefined) => {
  if (
    field.key === 'safe_wal_size_bytes' &&
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value < 0
  ) {
    return { display: 'Budget exceeded', detail: undefined }
  }
  if (field.zeroLabel && value === 0) return { display: field.zeroLabel, detail: undefined }
  return getFormattedLagValue(field.type, value)
}
