import { Column } from 'react-data-grid'
import type { LogData } from '../Logs.types'
import { ResponseCodeFormatter, RowLayout, TextFormatter } from '../LogsFormatters'
import { defaultRenderCell } from './DefaultPreviewColumnRenderer'
import { TimestampInfo } from 'ui-patterns/TimestampInfo'

const columns: Column<LogData>[] = [
  {
    name: 'database-api-first-column',
    key: 'database-api-first-column',
    renderCell: (props) => {
      if (!props.row.status_code && !props.row.method && !props.row.path) {
        return defaultRenderCell(props)
      }
      return (
        <RowLayout>
          <TimestampInfo value={props.row.timestamp!} />
          <ResponseCodeFormatter row={props} value={props.row.status_code} />
          <TextFormatter className="w-20" value={props.row.method as string} />
          <TextFormatter className="w-full" value={props.row.path as string} />
        </RowLayout>
      )
    },
  },
]

export default columns
