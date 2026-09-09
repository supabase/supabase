import { Column } from 'react-data-grid'
import { TimestampInfo } from 'ui-patterns/TimestampInfo'

import type { LogData } from '../Logs.types'
import { RowLayout, SeverityFormatter, TextFormatter } from '../LogsFormatters'

const columns: Column<LogData>[] = [
  {
    name: 'multigres-first-column',
    key: 'multigres-first-column',
    renderHeaderCell: () => null,
    renderCell: (props) => {
      const level = typeof props.row.level === 'string' ? props.row.level : undefined

      return (
        <RowLayout>
          {props.row.timestamp && <TimestampInfo utcTimestamp={props.row.timestamp} />}
          {level && <SeverityFormatter value={level} />}
          <TextFormatter className="w-full" value={props.row.event_message} />
        </RowLayout>
      )
    },
  },
]

export default columns
