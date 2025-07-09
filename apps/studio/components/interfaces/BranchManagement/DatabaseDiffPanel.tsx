import Link from 'next/link'
import { CircleAlert, Database, Wind } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, Skeleton } from 'ui'

import DiffViewer from 'components/ui/DiffViewer'

interface DatabaseDiffPanelProps {
  diffContent?: string
  isLoading: boolean
  error?: any
  showRefreshButton?: boolean
  currentBranchRef?: string
}

const DatabaseDiffPanel = ({
  diffContent,
  isLoading,
  error,
  currentBranchRef,
}: DatabaseDiffPanelProps) => {
  if (isLoading) return <Skeleton className="h-64" />

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
    <Card>
      <CardHeader>
        <CardTitle>
          <Link
            href={`/project/${currentBranchRef}/database/schema`}
            className="flex items-center gap-2"
          >
            <Database strokeWidth={1.5} size={16} className="text-foreground-muted" />
            Schema Changes
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 h-96">
        <DiffViewer language="sql" original="" modified={diffContent} />
      </CardContent>
    </Card>
  )
}

export default DatabaseDiffPanel
