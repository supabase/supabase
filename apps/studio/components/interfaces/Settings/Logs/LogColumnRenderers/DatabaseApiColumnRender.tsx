import { Column } from 'react-data-grid'
import { Service } from 'data/graphql/graphql'
import type { LogData } from '../Logs.types'
import { ResponseCodeFormatter, RowLayout, TextFormatter } from '../LogsFormatters'
import { defaultRenderCell } from './DefaultPreviewColumnRenderer'
import { TimestampInfo } from 'ui-patterns/TimestampInfo'
import { ErrorCodeTooltip } from '../ErrorCodeTooltip'

const columns: Column<LogData>[] = [
  {
    name: 'database-api-first-column',
    key: 'database-api-first-column',
    renderHeaderCell: () => null,
    renderCell: (props) => {
      if (!props.row.status_code && !props.row.method && !props.row.path) {
        return defaultRenderCell(props)
      }
      const error_code = props.row.metadata?.[0]?.response?.[0]?.headers?.[0]?.x_sb_error_code
      const service =
        typeof props.row.path === 'string' && props.row.path.startsWith('/auth/')
          ? Service.Auth
          : undefined
      return (
        <RowLayout>
          <TimestampInfo utcTimestamp={props.row.timestamp!} />
          <ResponseCodeFormatter value={String(props.row.status_code)} />
          <TextFormatter value={String(props.row.method)} />
          <TextFormatter value={String(props.row.path)} />
          {error_code && (
            <ErrorCodeTooltip errorCode={String(error_code)} service={service}>
              <span className="font-mono text-xs text-destructive-600 truncate shrink-0">
                {error_code}
              </span>
            </ErrorCodeTooltip>
          )}
        </RowLayout>
      )
    },
  },
]

export default columns
