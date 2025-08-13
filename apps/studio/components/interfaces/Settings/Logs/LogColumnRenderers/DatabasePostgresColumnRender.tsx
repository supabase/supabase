import { Column } from 'react-data-grid'
import type { LogData } from '../Logs.types'
import { RowLayout, SeverityFormatter, TextFormatter } from '../LogsFormatters'
import { defaultRenderCell } from './DefaultPreviewColumnRenderer'
import { TimestampInfo } from 'ui-patterns/TimestampInfo'

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
          <TimestampInfo utcTimestamp={props.row.timestamp!} />
          <SeverityFormatter value={props.row.error_severity as string} />
          <TextFormatter className="w-full" value={props.row.event_message} />
          {props.row.detail ? <TextFormatter value={props.row.detail as string} /> : null}
          {props.row.hint ? <TextFormatter value={props.row.hint as string} /> : null}
        </RowLayout>
      )
    },
  },
]

export default columns
