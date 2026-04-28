import { Badge, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import CodeEditor from '@/components/ui/CodeEditor/CodeEditor'

export const InferredSQLViewer = ({ sql }: { sql: string }) => {
  return (
    <>
      <div className="flex items-center justify-between px-4 py-2">
        <p className="text-sm">Inferred SQL:</p>
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
      <div className="h-44 relative">
        <CodeEditor isReadOnly id="inferred-sql" language="pgsql" value={sql} />
      </div>
    </>
  )
}
