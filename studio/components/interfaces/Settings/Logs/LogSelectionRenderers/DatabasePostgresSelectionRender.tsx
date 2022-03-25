import { Alert } from '@supabase/ui'
import React from 'react'
import { jsonSyntaxHighlight, SeverityFormatter } from '../LogsFormatters'

const DatabasePostgresSelectionRender = ({ log }: any) => {
  const postgresUsername = log?.metadata[0]?.parsed[0]?.user_name
  const sessionId = log?.metadata[0]?.parsed[0]?.session_id
  const hint = log?.metadata[0]?.parsed[0]?.hint

  const DetailedRow = ({ label, value }: { label: string; value: string | React.ReactNode }) => {
    return (
      <div className="grid grid-cols-12">
        <span className="text-scale-900 text-sm col-span-4">{label}</span>
        <span className="text-scale-1200 text-base col-span-8">{value}</span>
      </div>
    )
  }

  return (
    <>
      <div className="px-5">
        <span className="text-scale-900 text-sm col-span-4">Event message</span>

        <div
          className="text-xs text-wrap font-mono text-scale-1200 mt-2"
          dangerouslySetInnerHTML={{
            __html: log.event_message,
          }}
        />
      </div>
      <div className="h-px w-full bg-panel-border-interior-light dark:bg-panel-border-interior-dark"></div>
      <div className="px-5 space-y-2">
        <DetailedRow label="Severity" value={<SeverityFormatter value={log.error_severity} />} />
        <DetailedRow label="Postgres Username" value={postgresUsername} />
        <DetailedRow label="Session ID" value={sessionId} />
      </div>

      {hint && (
        <div className="mt-4 px-5">
          <Alert variant="warning" withIcon title={log?.metadata[0]?.parsed[0]?.hint} />
        </div>
      )}

      <div className="h-px w-full bg-panel-border-interior-light dark:bg-panel-border-interior-dark"></div>
      <div className="px-5">
        <h3 className="text-lg text-scale-1200 mb-4">Metadata</h3>
        <pre className="text-sm syntax-highlight overflow-x-auto">
          <div
            className="text-wrap"
            dangerouslySetInnerHTML={{
              __html: log.metadata ? jsonSyntaxHighlight(log.metadata[0]) : '',
            }}
          />
        </pre>
      </div>
    </>
  )
}

export const DatabaseApiSelectionHeaderRender = (log: any) => {
  const method = log?.metadata[0]?.request[0]?.method
  const path = log?.metadata[0]?.request[0]?.path

  return `${method} ${path}`
}

export default DatabasePostgresSelectionRender
