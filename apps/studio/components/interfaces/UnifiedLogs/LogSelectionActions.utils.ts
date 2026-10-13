import { z } from 'zod'

import { getLogDataForMetadataVisibility } from './ServiceFlowPanel.utils'
import { columnSchema } from './UnifiedLogs.schema'
import { getRawLogData } from './UnifiedLogs.utils'
import { parseOtelTimestamp } from '@/data/logs/otel-inspection.utils'

const selectedLogSchema = z
  .object({
    id: z.string(),
    timestamp: z.union([
      z.number().finite(),
      z
        .string()
        .refine(
          (value) => value.trim() !== '' && Number.isFinite(parseOtelTimestamp(value).getTime())
        ),
    ]),
    event_message: z.string(),
    metadata: z
      .record(z.unknown())
      .nullish()
      .transform((value) => value ?? undefined),
  })
  .passthrough()

const selectedLogsSchema = z
  .array(
    columnSchema
      .pick({ id: true, log_type: true, event_message: true, metadata: true })
      .extend({ timestamp: z.union([z.string(), z.number()]) })
      .passthrough()
  )
  .transform((rows) =>
    rows.map((row) => ({ ...getRawLogData(row), event_message: row.event_message ?? '' }))
  )

export function parseSelectedLogs(rows: unknown, metadataVisible: boolean) {
  return selectedLogsSchema
    .transform((logs) => logs.map((log) => getLogDataForMetadataVisibility(log, metadataVisible)))
    .pipe(z.array(selectedLogSchema))
    .safeParse(rows)
}
