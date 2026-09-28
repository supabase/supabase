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
  // Friendly label to show when the value is null/absent (e.g. unlimited WAL retention).
  nullLabel?: string
  // Optional hover text for the value, derived from the raw value (e.g. an absolute timestamp).
  getValueTooltip?: (value: number) => string
}

export const SLOT_LAG_FIELDS: SlotLagField[] = [
  {
    key: 'confirmed_flush_lsn_bytes',
    // Same label as the list column. Scoped to the main slot's ongoing change stream, so "Caught
    // up" stays true while tables are still doing their initial copy.
    label: 'Lag',
    type: 'bytes',
    description:
      'Changes still on their way to the destination, measured on the pipeline’s main slot. Tables in their initial sync use their own slots and aren’t counted.',
    zeroLabel: 'Caught up',
  },
  {
    key: 'safe_wal_size_bytes',
    label: 'WAL retention remaining',
    type: 'bytes',
    description: (
      <>
        How much more WAL can accumulate before the replication slot is at risk of being lost.
        Controlled by the <code className="text-code-inline">max_slot_wal_keep_size</code> setting.
      </>
    ),
    nullLabel: 'Unlimited',
  },
  {
    key: 'reply_time_lag',
    label: 'Last check-in',
    type: 'duration',
    description: 'Time since the pipeline last reported back to your database',
    zeroLabel: 'Just now',
    // reply_time_lag is "milliseconds ago", so the absolute time is now minus that, in local time.
    getValueTooltip: (ms) => dayjs().subtract(ms, 'millisecond').format('MMM D, YYYY, h:mm:ss A'),
  },
]

// Resolves a field's value into a display string (+ optional precise detail), honoring the
// friendly zero/null labels before falling back to the formatted byte/duration value.
export const getFieldDisplay = (field: SlotLagField, value: number | null | undefined) => {
  if (value == null) return { display: field.nullLabel ?? 'n/a', detail: undefined }
  if (field.zeroLabel && value === 0) return { display: field.zeroLabel, detail: undefined }
  return getFormattedLagValue(field.type, value)
}
