import { Column } from 'react-data-grid'
import type { LogData } from '../Logs.types'
import { IDFormatter, ResponseCodeFormatter, RowLayout, TextFormatter } from '../LogsFormatters'
import { defaultRenderCell } from './DefaultPreviewColumnRenderer'
import { TimestampInfo } from 'ui-patterns/TimestampInfo'

const columns: Column<LogData>[] = [
  {
    name: 'workflow-run-first-column',
    key: 'workflow-run-first-column',
    renderCell: (props) => {
      if (!props.row.workflow_run) {
        return defaultRenderCell(props)
      }
      return (
        <RowLayout>
          <TimestampInfo value={props.row.timestamp!} />
          <IDFormatter value={props.row.workflow_run as string} />
          <TextFormatter className="w-full" value={props.row.event_message} />
        </RowLayout>
      )
    },
  },
]

export default columns
