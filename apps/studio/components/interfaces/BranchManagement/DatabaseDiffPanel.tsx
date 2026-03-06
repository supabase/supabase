import { CircleAlert, Database, Download, Loader2, Wind } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

import { DiffEditor } from '@/components/ui/DiffEditor'
import { Button, Card, CardContent, CardHeader, CardTitle, Skeleton } from 'ui'

interface DatabaseDiffPanelProps {
  diffContent?: string
  isLoading: boolean
  error?: any
  showRefreshButton?: boolean
  currentBranchRef?: string
}

export const DatabaseDiffPanel = ({
  diffContent,
  isLoading,
  error,
  currentBranchRef,
}: DatabaseDiffPanelProps) => {
  if (isLoading) {
    return (
      <div className="flex flex-1 min-h-0 flex-col">
        <div className="flex flex-1 min-h-[400px] flex-col rounded-md border border-border bg-surface-100">
          <div className="flex shrink-0 items-center gap-2 border-b border-border px-4 py-3">
            <Loader2
              size={16}
              strokeWidth={1.5}
              className="animate-spin text-foreground-muted"
              aria-hidden
            />
            <span className="text-sm text-foreground-light">Loading database diff…</span>
          </div>
          <div className="min-h-0 flex-1 p-4">
            <Skeleton className="h-full w-full rounded" />
          </div>
        </div>
      </div>
    )
  }

  if (error)
    return (
      <div className="p-6 text-center">
        <CircleAlert size={32} strokeWidth={1.5} className="text-foreground-muted mx-auto mb-8" />
        <h3 className="mb-1">Error loading branch diff</h3>
        <p className="text-sm text-foreground-light">
          Please try again in a few minutes and contact support if the problem persists.
        </p>
      </div>
    )

  if (!diffContent || diffContent.trim() === '') {
    return (
      <div className="p-6 text-center">
        <Wind size={32} strokeWidth={1.5} className="text-foreground-muted mx-auto mb-8" />
        <h3 className="mb-1">No changes detected between branches</h3>
        <p className="text-sm text-foreground-light">
          Any changes to your database schema will be shown here for review
        </p>
      </div>
    )
  }

  return (
    <Card className="flex flex-1 min-h-0 flex-col">
      <CardHeader className="flex shrink-0 flex-row items-center justify-between space-y-0 py-3">
        <CardTitle>
          <Link
            href={`/project/${currentBranchRef}/database/schema`}
            className="flex items-center gap-2"
          >
            <Database strokeWidth={1.5} size={16} className="text-foreground-muted" />
            Schema Changes
          </Link>
        </CardTitle>
        <Button
          type="default"
          size="tiny"
          icon={<Download strokeWidth={1.5} size={14} className="text-foreground-light" />}
          className="mt-0"
          onClick={() => {
            if (!diffContent) return
            const now = new Date()
            const pad = (n: number) => n.toString().padStart(2, '0')
            const timestamp =
              now.getFullYear().toString() +
              pad(now.getMonth() + 1) +
              pad(now.getDate()) +
              pad(now.getHours()) +
              pad(now.getMinutes()) +
              pad(now.getSeconds())
            const filename = `${timestamp}_migration.sql`
            const blob = new Blob([diffContent], { type: 'text/plain;charset=utf-8;' })
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.setAttribute('download', filename)
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            window.URL.revokeObjectURL(url)
            toast.success('Migration file downloaded!')
          }}
        >
          Download as migration
        </Button>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col p-0">
        <div className="min-h-0 flex-1">
          <DiffEditor
            language="sql"
            original=""
            modified={diffContent}
            options={{ readOnly: true }}
          />
        </div>
      </CardContent>
    </Card>
  )
}
