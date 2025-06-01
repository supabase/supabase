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
          <TimestampInfo utcTimestamp={props.row.timestamp!} />
          <ResponseCodeFormatter value={String(props.row.status_code)} />
          <TextFormatter value={String(props.row.method)} />
          <TextFormatter value={String(props.row.path)} />
        </RowLayout>
      )
    },
  },
]

export default columns
