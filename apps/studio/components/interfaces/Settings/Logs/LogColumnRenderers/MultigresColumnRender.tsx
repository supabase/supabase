import { Column } from 'react-data-grid'
import { TimestampInfo } from 'ui-patterns/TimestampInfo'

import type { LogData } from '../Logs.types'
import { parseMultigresEventMessage } from '../Logs.utils'
import { RowLayout, SeverityFormatter, TextFormatter } from '../LogsFormatters'
import { defaultRenderCell } from './DefaultPreviewColumnRenderer'

const columns: Column<LogData>[] = [
  {
    name: 'multigres-first-column',
    key: 'multigres-first-column',
    renderHeaderCell: () => null,
    renderCell: (props) => {
      const parsed = parseMultigresEventMessage(props.row.event_message)
      const level = typeof parsed?.level === 'string' ? parsed.level : undefined
      const msg = typeof parsed?.msg === 'string' ? parsed.msg : undefined

      if (!level && !msg) {
        return defaultRenderCell(props)
      }

      return (
        <RowLayout>
          {props.row.timestamp && <TimestampInfo utcTimestamp={props.row.timestamp} />}
          {level && <SeverityFormatter value={level} />}
          <TextFormatter className="w-full" value={msg ?? props.row.event_message} />
        </RowLayout>
      )
    },
  },
]

export default columns
