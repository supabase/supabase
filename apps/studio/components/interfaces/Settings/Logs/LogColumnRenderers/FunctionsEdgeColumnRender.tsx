import { Column } from 'react-data-grid'
import type { LogData } from '../Logs.types'
import { ResponseCodeFormatter, RowLayout, TextFormatter } from '../LogsFormatters'
import { defaultRenderCell } from './DefaultPreviewColumnRenderer'
import { TimestampInfo } from 'ui-patterns/TimestampInfo'

const columns: Column<LogData>[] = [
  {
    name: 'functions-edge-first-column',
    key: 'functions-edge-first-column',
    renderCell: (props) => {
      if (!props.row.status_code && !props.row.method) {
        return defaultRenderCell(props)
      }
      return (
        <RowLayout>
          <TimestampInfo utcTimestamp={props.row.timestamp!} />
          <ResponseCodeFormatter row={props} value={props.row.status_code} />
          <TextFormatter
            value={
              typeof props.row.method === 'string' ? props.row.method : String(props.row.method)
            }
          />
          <TextFormatter
            value={typeof props.row.id === 'string' ? props.row.id : String(props.row.id)}
          />
        </RowLayout>
      )
    },
  },
]

export default columns
