import { Circle, Code, Minus, Plus, Wind } from 'lucide-react'
import Link from 'next/link'
import { basename } from 'path'
import { useEffect, useMemo, useState } from 'react'

import { DiffEditor } from '@/components/ui/DiffEditor'
import type { EdgeFunctionBodyData } from 'data/edge-functions/edge-function-body-query'
import type {
  EdgeFunctionsDiffResult,
  FileInfo,
  FileStatus,
} from 'hooks/branches/useEdgeFunctionsDiff'
import { EMPTY_ARR } from 'lib/void'
import { Card, CardContent, CardHeader, CardTitle, cn, Skeleton } from 'ui'

const EMPTY_FUNCTION_BODY: EdgeFunctionBodyData = {
  files: EMPTY_ARR,
}

interface EdgeFunctionsDiffPanelProps {
  diffResults: EdgeFunctionsDiffResult
  currentBranchRef?: string
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
      return 'text-brand'
    case 'removed':
      return 'text-destructive'
    case 'modified':
      return 'text-warning'
    case 'unchanged':
      return 'text-muted'
    default:
      return 'text-muted'
  }
}

// Helper to get the status icon for file indicators
const getStatusIcon = (status: FileStatus) => {
  switch (status) {
    case 'added':
      return Plus
    case 'removed':
      return Minus
    case 'modified':
      return Circle
    case 'unchanged':
      return Circle
    default:
      return Circle
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
  const allFileKeys = useMemo(() => fileInfos.map((info) => info.key), [fileInfos])

  const [activeFileKey, setActiveFileKey] = useState<string | undefined>(() => allFileKeys[0])

  // Keep active tab in sync when allFileKeys changes (e.g. data fetch completes)
  useEffect(() => {
    if (!activeFileKey || !allFileKeys.includes(activeFileKey)) {
      setActiveFileKey(allFileKeys[0])
    }
  }, [allFileKeys, activeFileKey])

  const currentFile = currentBody.files.find(
    (f: EdgeFunctionBodyData['files'][number]) => fileKey(f.name) === activeFileKey
  )
  const mainFile = mainBody.files.find(
    (f: EdgeFunctionBodyData['files'][number]) => fileKey(f.name) === activeFileKey
  )

  const language = useMemo(() => {
    if (!activeFileKey) return 'plaintext'
    if (activeFileKey.endsWith('.ts') || activeFileKey.endsWith('.tsx')) {
      return 'typescript'
    }
    if (activeFileKey.endsWith('.js') || activeFileKey.endsWith('.jsx')) {
      return 'javascript'
    }
    if (activeFileKey.endsWith('.json')) return 'json'
    if (activeFileKey.endsWith('.sql')) return 'sql'
    return 'plaintext'
  }, [activeFileKey])

  if (allFileKeys.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Link
            href={`/project/${currentBranchRef}/functions/${functionSlug}`}
            className="flex items-center gap-2"
          >
            <Code strokeWidth={1.5} size={16} className="text-foreground-muted" />
            {functionSlug}
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 h-96">
        <div className="flex h-full min-h-0">
          <div className="w-48 border-r bg-surface-200 flex flex-col overflow-y-auto">
            <ul className="divide-y divide-border">
              {fileInfos.map((fileInfo) => {
                const Icon = getStatusIcon(fileInfo.status)

                return (
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
                      <Icon
                        className={cn('flex-shrink-0', getStatusColor(fileInfo.status))}
                        size={12}
                        strokeWidth={1}
                      />
                      <span className="truncate">{fileInfo.key}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
          <div className="flex-1 min-h-0">
            <DiffEditor
              language={language}
              original={mainFile?.content || ''}
              modified={currentFile?.content || ''}
              options={{ readOnly: true }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export const EdgeFunctionsDiffPanel = ({
  diffResults,
  currentBranchRef,
}: EdgeFunctionsDiffPanelProps) => {
  if (diffResults.isLoading) {
    return <Skeleton className="h-64" />
  }

  const noChanges = diffResults.addedSlugs.length === 0 && diffResults.modifiedSlugs.length === 0

  if (noChanges) {
    return (
      <div className="p-6 text-center">
        <Wind size={32} strokeWidth={1.5} className="text-foreground-muted mx-auto mb-8" />
        <h3 className="mb-1">No changes detected between branches</h3>
        <p className="text-sm text-foreground-light">
          Any changes to your edge functions will be shown here for review
        </p>
      </div>
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
                mainBody={EMPTY_FUNCTION_BODY}
                currentBranchRef={currentBranchRef}
                fileInfos={diffResults.functionFileInfo[slug] || EMPTY_ARR}
              />
            ))}
          </div>
        </div>
      )}
      {/* TODO: Removing functions is not supported yet */}
      {/* {diffResults.removedSlugs.length > 0 && (
        <div>
          <div className="space-y-4">
            {diffResults.removedSlugs.map((slug) => (
              <FunctionDiff
                key={slug}
                functionSlug={slug}
                currentBody={EMPTY_ARR}
                mainBody={diffResults.removedBodiesMap[slug]!}
                currentBranchRef={mainBranchRef}
                fileInfos={diffResults.functionFileInfo[slug] || EMPTY_ARR}
              />
            ))}
          </div>
        </div>
      )} */}

      {diffResults.modifiedSlugs.length > 0 && (
        <div className="space-y-4">
          {diffResults.modifiedSlugs.map((slug) => (
            <FunctionDiff
              key={slug}
              functionSlug={slug}
              currentBody={diffResults.currentBodiesMap[slug]!}
              mainBody={diffResults.mainBodiesMap[slug]!}
              currentBranchRef={currentBranchRef}
              fileInfos={diffResults.functionFileInfo[slug] || EMPTY_ARR}
            />
          ))}
        </div>
      )}
    </div>
  )
}
