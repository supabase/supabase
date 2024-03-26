import { Column } from 'react-data-grid'
import type { LogData } from '../Logs.types'
import {
  ResponseCodeFormatter,
  RowLayout,
  TextFormatter,
  TimestampLocalFormatter,
} from '../LogsFormatters'
import { defaultRenderCell } from './DefaultPreviewColumnRenderer'

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
          <TimestampLocalFormatter value={props.row.timestamp!} />
          <ResponseCodeFormatter row={props} value={props.row.status_code} />
          <TextFormatter value={props.row.method as string} />
          <TextFormatter value={props.row.id} />
        </RowLayout>
      )
    },
  },
]

export default columns
