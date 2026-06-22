import { Column } from 'react-data-grid'
import { TimestampInfo } from 'ui-patterns/TimestampInfo'

import type { LogData } from '../Logs.types'
import { getAuthLogSeverity } from '../Logs.utils'
import { RowLayout, SeverityFormatter, TextFormatter } from '../LogsFormatters'
import { defaultRenderCell } from './DefaultPreviewColumnRenderer'
import { parseAuthLogEventMessage } from '@/components/interfaces/UnifiedLogs/UnifiedLogs.utils'

const columns: Column<LogData>[] = [
  {
    name: 'auth-first-column',
    key: 'auth-first-column',
    renderHeaderCell: () => null,
    renderCell: (props) => {
      if (!props.row.level) {
        return defaultRenderCell(props)
      }

      return (
        <RowLayout>
          <TimestampInfo utcTimestamp={props.row.timestamp!} />
          {props.row.level && (
            <SeverityFormatter value={getAuthLogSeverity(props.row.level, props.row.status)} />
          )}
          <TextFormatter
            className="w-full"
            value={`${props.row.path ? props.row.path + ' | ' : ''}${
              // not all log events have metadata.msg
              (props.row.msg as string)?.trim() || parseAuthLogEventMessage(props.row.event_message)
            }`}
          />
        </RowLayout>
      )
    },
  },
]

export default columns
