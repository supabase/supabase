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
    name: 'database-postgres-first-column',
    key: 'database-postgres-first-column',
    renderCell: (props) => {
      if (!props.row.error_severity) {
        return defaultRenderCell(props)
      }
      return (
        <RowLayout>
          <TimestampLocalFormatter value={props.row.timestamp!} />
          <SeverityFormatter value={props.row.error_severity as string} />
          <TextFormatter className="w-full" value={props.row.event_message} />
        </RowLayout>
      )
    },
  },
]

export default columns
