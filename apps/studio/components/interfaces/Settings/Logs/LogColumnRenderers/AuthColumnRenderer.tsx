import { Column } from 'react-data-grid'

import type { LogData } from '../Logs.types'
import {
  RowLayout,
  SeverityFormatter,
  TextFormatter,
  TimestampLocalFormatter,
} from '../LogsFormatters'
import { defaultRenderCell } from './DefaultPreviewColumnRenderer'

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
          <TimestampLocalFormatter value={props.row.timestamp!} />
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
