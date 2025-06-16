import { DiffEditor } from '@monaco-editor/react'
import { Database, Wind, Loader2 } from 'lucide-react'
import { editor as monacoEditor } from 'monaco-editor'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, Skeleton } from 'ui'

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
  showRefreshButton = false,
  currentBranchRef,
  onRefresh,
}: DatabaseDiffPanelProps) => {
  // Monaco editor options for diff display
  const defaultOptions: monacoEditor.IStandaloneDiffEditorConstructionOptions = {
    readOnly: true,
    renderSideBySide: false,
    minimap: { enabled: false },
    wordWrap: 'on',
    lineNumbers: 'on',
    folding: false,
    padding: { top: 16, bottom: 16 },
    lineNumbersMinChars: 3,
    fontSize: 13,
    scrollBeyondLastLine: false,
  }

  if (isLoading) {
    return <Skeleton className="h-64" />
  }

  if (error) {
    const isConnectionError =
      error.message?.includes('ECONNREFUSED') || error.message?.includes('Failed to diff branch')

    return (
      <div className="p-6 text-center">
        <div className="text-red-500 mb-2">
          <p>Error loading branch diff</p>
        </div>
        {isConnectionError ? (
          <div className="text-sm text-gray-600 space-y-1">
            <p>Unable to connect to the branch database. This could be because:</p>
            <ul className="list-disc list-inside text-left max-w-md mx-auto">
              <li>The branch database is not ready yet</li>
              <li>The branch is in an inactive state</li>
              <li>There's a temporary networking issue</li>
            </ul>
            <p className="mt-2">Please try again in a few minutes.</p>
          </div>
        ) : (
          <p className="text-sm text-gray-600">{error.message}</p>
        )}
      </div>
    )
  }

  // Handle empty diff content
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
            className="text-foreground-light flex items-center gap-2"
          >
            <Database strokeWidth={1.5} size={16} />
            Schema Changes
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 h-96">
        <DiffEditor
          theme="supabase"
          language="sql"
          height="100%"
          original=""
          modified={diffContent}
          options={defaultOptions}
        />
      </CardContent>
    </Card>
  )
}

export default DatabaseDiffPanel
