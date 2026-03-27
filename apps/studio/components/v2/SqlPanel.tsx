'use client'

import { useProjectDetailQuery } from 'data/projects/project-detail-query'
import { useExecuteSqlMutation } from 'data/sql/execute-sql-mutation'
import { useState } from 'react'
import { Button } from 'ui'

import { useV2Params } from '@/app/v2/V2ParamsContext'

export function SqlPanel() {
  const { projectRef } = useV2Params()
  const [sql, setSql] = useState('SELECT 1')
  const { data: project } = useProjectDetailQuery(
    { ref: projectRef },
    { enabled: Boolean(projectRef) }
  )
  const { mutate: executeSql, isPending, data, error } = useExecuteSqlMutation()

  const handleRun = () => {
    if (!projectRef || !project?.connectionString) return
    executeSql({
      projectRef,
      connectionString: project.connectionString,
      sql,
    })
  }

  return (
    <div className="flex flex-col h-full p-3">
      <textarea
        value={sql}
        onChange={(e) => setSql(e.target.value)}
        placeholder="SELECT 1"
        className="flex-1 min-h-[120px] w-full rounded border border-border bg-background p-2 text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-ring"
        spellCheck={false}
      />
      <Button
        type="primary"
        size="small"
        className="mt-2"
        onClick={handleRun}
        disabled={isPending || !projectRef}
      >
        {isPending ? 'Running…' : 'Run'}
      </Button>
      {error && (
        <pre className="mt-2 p-2 text-xs text-destructive bg-destructive/10 rounded overflow-auto">
          {error.message}
        </pre>
      )}
      {data?.result && (
        <pre
          className="mt-2 p-2 text-xs text-foreground
foreground-muted bg-muted/30 rounded overflow-auto max-h-40"
        >
          {JSON.stringify(data.result, null, 2)}
        </pre>
      )}
    </div>
  )
}
