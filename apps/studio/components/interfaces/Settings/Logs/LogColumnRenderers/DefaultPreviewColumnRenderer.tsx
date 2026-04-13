import { Column, RenderCellProps } from 'react-data-grid'
import { TimestampInfo } from 'ui-patterns/TimestampInfo'

import type { LogData } from '../Logs.types'
import { RowLayout, TextFormatter } from '../LogsFormatters'

export const defaultRenderCell = (props: RenderCellProps<LogData, unknown>) => (
  <RowLayout>
    <TimestampInfo utcTimestamp={props.row.timestamp!} />
    <TextFormatter className="w-full" value={props.row.event_message} />
  </RowLayout>
)

const columns: Column<LogData>[] = [
  {
    name: 'default-preview-first-column',
    key: 'default-preview-first-column',
    renderHeaderCell: () => null,
    renderCell: defaultRenderCell,
  },
]

export default columns
