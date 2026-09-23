import { z } from 'zod'

import { getLogDataForMetadataVisibility } from './ServiceFlowPanel.utils'
import { columnSchema } from './UnifiedLogs.schema'
import { getRawLogData } from './UnifiedLogs.utils'

const selectedLogSchema = z
  .object({
    id: z.string(),
    timestamp: z.number().finite(),
    event_message: z.string(),
    metadata: z
      .record(z.unknown())
      .nullish()
      .transform((value) => value ?? undefined),
  })
  .passthrough()

const selectedLogsSchema = z
  .array(columnSchema.passthrough())
  .transform((rows) =>
    rows.map((row) => ({ ...getRawLogData(row), event_message: row.event_message ?? '' }))
  )

export function parseSelectedLogs(rows: unknown, metadataVisible: boolean) {
  return selectedLogsSchema
    .transform((logs) => logs.map((log) => getLogDataForMetadataVisibility(log, metadataVisible)))
    .pipe(z.array(selectedLogSchema))
    .safeParse(rows)
}
