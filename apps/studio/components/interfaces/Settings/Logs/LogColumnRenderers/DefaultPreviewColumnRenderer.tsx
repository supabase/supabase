import { Column, RenderCellProps } from 'react-data-grid'
import type { LogData } from '../Logs.types'
import { RowLayout, TextFormatter } from '../LogsFormatters'
import { TimestampInfo } from 'ui-patterns/TimestampInfo'

export const defaultRenderCell = (props: RenderCellProps<LogData, unknown>) => (
  <RowLayout>
    <TimestampInfo value={props.row.timestamp!} />
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
