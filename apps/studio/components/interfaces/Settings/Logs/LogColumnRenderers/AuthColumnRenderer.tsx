import { Column } from 'react-data-grid'

import type { LogData } from '../Logs.types'
import { RowLayout, SeverityFormatter, TextFormatter } from '../LogsFormatters'
import { defaultRenderCell } from './DefaultPreviewColumnRenderer'
import { TimestampInfo } from 'ui-patterns/TimestampInfo'

const columns: Column<LogData>[] = [
  {
    name: 'auth-first-column',
    key: 'auth-first-column',
    renderCell: (props) => {
      if (!props.row.level) {
        return defaultRenderCell(props)
      }

      return (
        <RowLayout>
          <TimestampInfo value={props.row.timestamp!} />
          {props.row.level && <SeverityFormatter value={props.row.level as string} />}
          <TextFormatter
            className="w-full"
            value={`${props.row.path ? props.row.path + ' | ' : ''}${
              // not all log events have metadata.msg
              (props.row.msg as string)?.trim() || props.row.event_message
            }`}
          />
        </RowLayout>
      )
    },
  },
]

export default columns
