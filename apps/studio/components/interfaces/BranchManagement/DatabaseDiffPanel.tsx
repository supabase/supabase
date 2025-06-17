import Link from 'next/link'
import { Database, Wind } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from 'ui'

import DiffViewer from 'components/ui/DiffViewer'
import { Loading, ErrorState, EmptyState } from 'components/ui/AsyncState'

interface DatabaseDiffPanelProps {
  diffContent?: string
  isLoading: boolean
  error?: any
  showRefreshButton?: boolean
  currentBranchRef?: string
  onRefresh?: () => void
}

const DatabaseDiffPanel = ({
  diffContent,
  isLoading,
  error,
  currentBranchRef,
  onRefresh,
}: DatabaseDiffPanelProps) => {
  if (isLoading) return <Loading />

  if (error) return <ErrorState message="Error loading branch diff" />

  // Handle empty diff content
  if (!diffContent || diffContent.trim() === '') {
    return (
      <EmptyState
        title="No changes detected between branches"
        description="Any changes to your database schema will be shown here for review"
        icon={Wind}
      />
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Link
            href={`/project/${currentBranchRef}/database/schema`}
            className="text-foreground-light flex items-center gap-2"
          >
            <Database strokeWidth={1.5} size={16} />
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
