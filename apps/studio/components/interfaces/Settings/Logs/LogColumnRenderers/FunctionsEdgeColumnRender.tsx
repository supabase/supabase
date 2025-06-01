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
          <ResponseCodeFormatter value={String(props.row.status_code)} />
          <TextFormatter value={String(props.row.method)} />
          <TextFormatter value={String(props.row.id)} />
        </RowLayout>
      )
    },
  },
]

export default columns
