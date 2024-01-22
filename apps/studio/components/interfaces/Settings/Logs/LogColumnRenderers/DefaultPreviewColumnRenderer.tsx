import { Column, RenderCellProps } from 'react-data-grid'
import { LogData } from '..'
import { RowLayout, TextFormatter, TimestampLocalFormatter } from '../LogsFormatters'

export const defaultRenderCell = (props: RenderCellProps<LogData, unknown>) => (
  <RowLayout>
    <TimestampLocalFormatter value={props.row.timestamp!} />
    <TextFormatter className="w-full" value={props.row.event_message} />
  </RowLayout>
)

const columns: Column<LogData>[] = [
  {
    name: 'default-preview-first-column',
    key: 'default-preview-first-column',
    renderCell: defaultRenderCell,
  },
]

export default columns
