import { UntrustedSqlFragment } from '@supabase/pg-meta'
import { Loader2 } from 'lucide-react'
import { Badge, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import CodeEditor from '@/components/ui/CodeEditor/CodeEditor'

export const InferredSQLViewer = ({
  sql,
  isLoading = false,
}: {
  sql: UntrustedSqlFragment | undefined
  isLoading?: boolean
}) => {
  return (
    <>
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-x-2">
          <p className="text-sm">Inferred SQL:</p>
          {isLoading && <Loader2 size={14} className="animate-spin text-foreground-lighter" />}
        </div>
        <div className="flex items-center gap-x-2">
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="warning">Generated</Badge>
            </TooltipTrigger>
            <TooltipContent side="bottom" align="end" className="w-64 text-center">
              This query is inferred from client library code with the help of the Assistant and may
              not guarantee correctness.
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
      <div className="h-44 relative">
        {isLoading && !sql ? (
          <div className="flex h-full items-center justify-center bg-surface-100 text-foreground-lighter">
            <Loader2 size={20} className="animate-spin" />
          </div>
        ) : (
          <CodeEditor isReadOnly id="inferred-sql" language="pgsql" value={sql ?? ''} />
        )}
      </div>
    </>
  )
}
