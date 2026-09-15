import { AlertTriangle } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import CopyButton from '@/components/ui/CopyButton'
import { getSqlNoticeLines, type PostgresNotice } from '@/data/sql/utils'

/**
 * The NOTICE/WARNING messages Postgres emitted while a successful query ran, printed the way
 * psql prints them. Renders nothing when there are none.
 */
export const SqlNotices = ({ notices }: { notices: readonly PostgresNotice[] }) => {
  if (notices.length === 0) return null

  const noticeLines = notices.map(getSqlNoticeLines)

  return (
    <div
      role="status"
      className="flex flex-row justify-between items-start gap-x-4 px-6 py-4 border-b bg-table-header-light in-data-[theme*=dark]:bg-table-header-dark"
    >
      <div className="flex flex-row items-start gap-x-3">
        <AlertTriangle size={14} className="shrink-0 mt-0.5 text-warning" />
        <div className="flex flex-col gap-y-2">
          {noticeLines.map((lines, noticeIdx) => (
            <div key={`notice-${noticeIdx}`} className="flex flex-col gap-y-1">
              {lines.map((line, lineIdx) => (
                <pre key={`notice-${noticeIdx}-${lineIdx}`} className="font-mono text-sm text-wrap">
                  {line}
                </pre>
              ))}
            </div>
          ))}
        </div>
      </div>
      <Tooltip>
        <TooltipTrigger>
          <CopyButton
            iconOnly
            variant="default"
            text={noticeLines.map((lines) => lines.join('\n')).join('\n\n')}
          />
        </TooltipTrigger>
        <TooltipContent side="bottom" align="center">
          <span>Copy notices</span>
        </TooltipContent>
      </Tooltip>
    </div>
  )
}
