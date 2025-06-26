import type { EdgeFunctionsData } from 'data/edge-functions/edge-functions-query'
import type { EdgeFunctionBodyData } from 'data/edge-functions/edge-function-body-query'

import { Card, CardContent, CardHeader, CardTitle, cn } from 'ui'
import { Code, Wind } from 'lucide-react'
import DiffViewer from 'components/ui/DiffViewer'
import { Loading, EmptyState } from 'components/ui/AsyncState'
import type { EdgeFunctionsDiffResult, FileInfo, FileStatus } from 'hooks/misc/useEdgeFunctionsDiff'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { basename } from 'path'

interface EdgeFunctionsDiffPanelProps {
  diffResults: EdgeFunctionsDiffResult
  currentBranchRef?: string
  mainBranchRef?: string
}

interface FunctionDiffProps {
  functionSlug: string
  currentBody: EdgeFunctionBodyData
  mainBody: EdgeFunctionBodyData
  currentBranchRef?: string
  fileInfos: FileInfo[]
}

// Helper to canonicalize file identifiers to prevent mismatch due to differing root paths
const fileKey = (fullPath: string) => basename(fullPath)

// Helper to get the status color for file indicators
const getStatusColor = (status: FileStatus): string => {
  switch (status) {
    case 'added':
      return 'bg-brand'
    case 'removed':
      return 'bg-destructive'
    case 'modified':
      return 'bg-warning'
    case 'unchanged':
      return 'bg-muted'
    default:
      return 'bg-muted'
  }
}

const FunctionDiff = ({
  functionSlug,
  currentBody,
  mainBody,
  currentBranchRef,
  fileInfos,
}: FunctionDiffProps) => {
  // Get all file keys from fileInfos
  const allFileKeys = fileInfos.map((info) => info.key)

  const [activeFileKey, setActiveFileKey] = useState<string | undefined>(() => allFileKeys[0])

  // Keep active tab in sync when allFileKeys changes (e.g. data fetch completes)
  useEffect(() => {
    if (!activeFileKey || !allFileKeys.includes(activeFileKey)) {
      setActiveFileKey(allFileKeys[0])
    }
  }, [allFileKeys, activeFileKey])

  const currentFile = currentBody.find((f) => fileKey(f.name) === activeFileKey)
  const mainFile = mainBody.find((f) => fileKey(f.name) === activeFileKey)

  const language = useMemo(() => {
    if (!activeFileKey) return 'plaintext'
    if (activeFileKey.endsWith('.ts') || activeFileKey.endsWith('.tsx')) return 'typescript'
    if (activeFileKey.endsWith('.js') || activeFileKey.endsWith('.jsx')) return 'javascript'
    if (activeFileKey.endsWith('.json')) return 'json'
    if (activeFileKey.endsWith('.sql')) return 'sql'
    return 'plaintext'
  }, [activeFileKey])

  if (allFileKeys.length === 0) return null

  return (
    <Card>
      <CardHeader className="space-y-0 px-4">
        {/* Function title */}
        <CardTitle>
          <Link
            href={`/project/${currentBranchRef}/functions/${functionSlug}`}
            className="flex items-center gap-2"
          >
            <Code strokeWidth={1.5} size={16} className="text-foreground-light" />
            {functionSlug}
          </Link>
        </CardTitle>

        {/* File list sidebar will be shown instead of top tabs */}
      </CardHeader>
      <CardContent className="p-0 h-96">
        <div className="flex h-full min-h-0">
          {/* Sidebar file list */}
          <div className="w-48 border-r bg-surface-200 flex flex-col overflow-y-auto">
            <ul className="divide-y divide-border">
              {fileInfos.map((fileInfo) => (
                <li key={fileInfo.key} className="flex">
                  <button
                    type="button"
                    onClick={() => setActiveFileKey(fileInfo.key)}
                    className={cn(
                      'flex-1 text-left text-xs px-4 py-2 flex items-center gap-2',
                      activeFileKey === fileInfo.key
                        ? 'bg-surface-300 text-foreground'
                        : 'text-foreground-light hover:bg-surface-300'
                    )}
                  >
                    <div
                      className={cn(
                        'w-1 h-1 rounded-full flex-shrink-0',
                        getStatusColor(fileInfo.status)
                      )}
                    />
                    <span className="truncate">{fileInfo.key}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Diff viewer */}
          <div className="flex-1 min-h-0">
            <DiffViewer
              language={language}
              original={mainFile?.content || ''}
              modified={currentFile?.content || ''}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const EdgeFunctionsDiffPanel = ({
  diffResults,
  currentBranchRef,
  mainBranchRef,
}: EdgeFunctionsDiffPanelProps) => {
  if (diffResults.isLoading) {
    return <Loading />
  }

  if (!diffResults.hasChanges) {
    return (
      <EmptyState
        title="No changes detected between branches"
        description="Any changes to your edge functions will be shown here for review"
        icon={Wind}
      />
    )
  }

  return (
    <div className="space-y-6">
      {diffResults.addedSlugs.length > 0 && (
        <div>
          <div className="space-y-4">
            {diffResults.addedSlugs.map((slug) => (
              <FunctionDiff
                key={slug}
                functionSlug={slug}
                currentBody={diffResults.addedBodiesMap[slug]!}
                mainBody={[] as EdgeFunctionBodyData}
                currentBranchRef={currentBranchRef}
                fileInfos={diffResults.functionFileInfo[slug] || []}
              />
            ))}
          </div>
        </div>
      )}

      {diffResults.removedSlugs.length > 0 && (
        <div>
          <div className="space-y-4">
            {diffResults.removedSlugs.map((slug) => (
              <FunctionDiff
                key={slug}
                functionSlug={slug}
                currentBody={[] as EdgeFunctionBodyData}
                mainBody={diffResults.removedBodiesMap[slug]!}
                currentBranchRef={mainBranchRef}
                fileInfos={diffResults.functionFileInfo[slug] || []}
              />
            ))}
          </div>
        </div>
      )}

      {diffResults.modifiedSlugs.length > 0 && (
        <div className="space-y-4">
          {diffResults.modifiedSlugs.map((slug) => (
            <FunctionDiff
              key={slug}
              functionSlug={slug}
              currentBody={diffResults.currentBodiesMap[slug]!}
              mainBody={diffResults.mainBodiesMap[slug]!}
              currentBranchRef={currentBranchRef}
              fileInfos={diffResults.functionFileInfo[slug] || []}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default EdgeFunctionsDiffPanel
