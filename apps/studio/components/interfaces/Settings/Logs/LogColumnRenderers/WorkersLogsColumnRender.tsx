import { Column } from 'react-data-grid'
import { TimestampInfo } from 'ui-patterns/TimestampInfo'

import type { LogData } from '../Logs.types'
import { RowLayout, SeverityFormatter, TextFormatter } from '../LogsFormatters'

const columns: Column<LogData>[] = [
  {
    name: 'workers-logs-first-column',
    key: 'workers-logs-first-column',
    renderHeaderCell: () => null,
    renderCell: (props) => (
      <RowLayout>
        <TimestampInfo utcTimestamp={props.row.timestamp!} />
        {props.row.severity_text ? (
          <SeverityFormatter value={props.row.severity_text as string} />
        ) : null}
        <TextFormatter className="w-full" value={props.row.event_message} />
      </RowLayout>
    ),
  },
]

export default columns
