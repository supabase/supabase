import { Column } from 'react-data-grid'
import { TimestampInfo } from 'ui-patterns/TimestampInfo'

import type { LogData } from '../Logs.types'
import { RowLayout, SeverityFormatter, TextFormatter } from '../LogsFormatters'
import { defaultRenderCell } from './DefaultPreviewColumnRenderer'

interface ParsedMultigresEvent {
  level?: string
  msg?: string
}

const parseMultigresEvent = (eventMessage: string | undefined): ParsedMultigresEvent => {
  if (!eventMessage) return {}
  try {
    const parsed = JSON.parse(eventMessage)
    if (parsed && typeof parsed === 'object') {
      return {
        level: typeof parsed.level === 'string' ? parsed.level : undefined,
        msg: typeof parsed.msg === 'string' ? parsed.msg : undefined,
      }
    }
  } catch {
    // event_message is not JSON, fall back to defaults
  }
  return {}
}

const columns: Column<LogData>[] = [
  {
    name: 'multigres-first-column',
    key: 'multigres-first-column',
    renderHeaderCell: () => null,
    renderCell: (props) => {
      const { level, msg } = parseMultigresEvent(props.row.event_message)

      if (!level && !msg) {
        return defaultRenderCell(props)
      }

      return (
        <RowLayout>
          <TimestampInfo utcTimestamp={props.row.timestamp!} />
          {level && <SeverityFormatter value={level} />}
          <TextFormatter className="w-full" value={msg ?? props.row.event_message} />
        </RowLayout>
      )
    },
  },
]

export default columns
