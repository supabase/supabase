import { Column } from 'react-data-grid'
import { LogData } from '..'
import { RowLayout, TextFormatter, TimestampLocalFormatter } from '../LogsFormatters'

const columns: Column<LogData>[] = [
  {
    name: 'default-preview-first-column',
    key: 'default-preview-first-column',
    renderCell: (props) => (
      <RowLayout>
        <TimestampLocalFormatter value={props.row.timestamp!} />
        <TextFormatter className="w-full" value={props.row.event_message} />
      </RowLayout>
    ),
  },
]

export default columns
