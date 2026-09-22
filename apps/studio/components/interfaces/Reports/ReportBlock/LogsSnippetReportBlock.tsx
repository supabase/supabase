import { ScrollText } from 'lucide-react'
import { ReactNode } from 'react'

import { ReportBlockContainer } from './ReportBlockContainer'

interface LogsSnippetReportBlockProps {
  label: string
  actions?: ReactNode
}

/**
 * Stands in for a snippet that queries the logs backend. Reports only run SQL
 * against the user's database, so a `log_sql` snippet reference renders this
 * instead of executing — see ReportBlock, which never issues a query for one.
 */
export const LogsSnippetReportBlock = ({ label, actions }: LogsSnippetReportBlockProps) => {
  return (
    <ReportBlockContainer
      draggable
      showDragHandle
      loading={false}
      icon={<ScrollText size={14} className="text-foreground-muted" />}
      label={label}
      actions={actions}
    >
      <div className="flex flex-1 flex-col justify-center gap-y-1 px-5 py-4">
        <p className="text-xs text-foreground-light">
          Logs snippets aren't supported in reports yet
        </p>
        <p className="text-xs text-foreground-lighter">
          Reports can't run queries against the logs backend yet. Open this snippet in the SQL
          editor to view results, or remove it from this report.
        </p>
      </div>
    </ReportBlockContainer>
  )
}
