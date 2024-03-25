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
    name: 'functions-logs-first-column',
    key: 'functions-logs-first-column',
    renderCell: (props) => {
      if (!props.row.event_type && !props.row.level) {
        return defaultRenderCell(props)
      }
      return (
        <RowLayout>
          <TimestampLocalFormatter value={props.row.timestamp!} />
          {props.row.event_type === 'uncaughtException' ? (
            <SeverityFormatter value={props.row.event_type} uppercase={false} />
          ) : (
            <SeverityFormatter value={props.row.level as string} />
          )}
          <TextFormatter className="w-full" value={props.row.event_message} />
        </RowLayout>
      )
    },
  },
]

export default columns
