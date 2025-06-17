import type { EdgeFunctionsData } from 'data/edge-functions/edge-functions-query'
import type { EdgeFunctionBodyData } from 'data/edge-functions/edge-function-body-query'

import { Card, CardContent, CardHeader, CardTitle, cn } from 'ui'
import { Code, Wind } from 'lucide-react'
import DiffViewer from 'components/ui/DiffViewer'
import { Loading, EmptyState } from 'components/ui/AsyncState'
import useEdgeFunctionsDiff from 'hooks/misc/useEdgeFunctionsDiff'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { basename } from 'path'

interface EdgeFunctionsDiffPanelProps {
  currentBranchFunctions?: EdgeFunctionsData
  mainBranchFunctions?: EdgeFunctionsData
  isCurrentFunctionsLoading: boolean
  isMainFunctionsLoading: boolean
  currentBranchRef?: string
  mainBranchRef?: string
}

interface FunctionDiffProps {
  functionSlug: string
  currentBody: EdgeFunctionBodyData
  mainBody: EdgeFunctionBodyData
  currentBranchRef?: string
}

// Helper to canonicalize file identifiers to prevent mismatch due to differing root paths
const fileKey = (fullPath: string) => basename(fullPath)

const FunctionDiff = ({
  functionSlug,
  currentBody,
  mainBody,
  currentBranchRef,
}: FunctionDiffProps) => {
  // Determine list of files with differences (by canonical key)
  const diffFileKeys = useMemo(() => {
    const keys = new Set([...currentBody, ...mainBody].map((f) => fileKey(f.name)))

    return Array.from(keys).filter((key) => {
      const currentFile = currentBody.find((f) => fileKey(f.name) === key)
      const mainFile = mainBody.find((f) => fileKey(f.name) === key)
      return (currentFile?.content || '') !== (mainFile?.content || '')
    })
  }, [currentBody, mainBody])

  const [activeFileKey, setActiveFileKey] = useState<string | undefined>(() => diffFileKeys[0])

  // Keep active tab in sync when diffFileKeys changes (e.g. data fetch completes)
  useEffect(() => {
    if (!activeFileKey || !diffFileKeys.includes(activeFileKey)) {
      setActiveFileKey(diffFileKeys[0])
    }
  }, [diffFileKeys, activeFileKey])

  if (diffFileKeys.length === 0) return null

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
              {diffFileKeys.map((key) => (
                <li key={key} className="flex">
                  <button
                    type="button"
                    onClick={() => setActiveFileKey(key)}
                    className={cn(
                      'flex-1 text-left text-xs px-4 py-2 flex items-center gap-2',
                      activeFileKey === key
                        ? 'bg-surface-300 text-foreground'
                        : 'text-foreground-light hover:bg-surface-300'
                    )}
                  >
                    {key}
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
  currentBranchFunctions,
  mainBranchFunctions,
  isCurrentFunctionsLoading,
  isMainFunctionsLoading,
  currentBranchRef,
  mainBranchRef,
}: EdgeFunctionsDiffPanelProps) => {
  const {
    addedSlugs,
    removedSlugs,
    modifiedSlugs,
    addedBodiesMap,
    removedBodiesMap,
    currentBodiesMap,
    mainBodiesMap,
    isLoading,
    hasChanges,
  } = useEdgeFunctionsDiff({
    currentBranchFunctions,
    mainBranchFunctions,
    currentBranchRef,
    mainBranchRef,
  })

  if (isCurrentFunctionsLoading || isMainFunctionsLoading || isLoading) {
    return <Loading />
  }

  if (!hasChanges) {
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
      {addedSlugs.length > 0 && (
        <div>
          <div className="space-y-4">
            {addedSlugs.map((slug) => (
              <FunctionDiff
                key={slug}
                functionSlug={slug}
                currentBody={addedBodiesMap[slug]!}
                mainBody={[] as EdgeFunctionBodyData}
                currentBranchRef={currentBranchRef}
              />
            ))}
          </div>
        </div>
      )}

      {removedSlugs.length > 0 && (
        <div>
          <div className="space-y-4">
            {removedSlugs.map((slug) => (
              <FunctionDiff
                key={slug}
                functionSlug={slug}
                currentBody={[] as EdgeFunctionBodyData}
                mainBody={removedBodiesMap[slug]!}
                currentBranchRef={mainBranchRef}
              />
            ))}
          </div>
        </div>
      )}

      {modifiedSlugs.length > 0 && (
        <div className="space-y-4">
          {modifiedSlugs.map((slug) => (
            <FunctionDiff
              key={slug}
              functionSlug={slug}
              currentBody={currentBodiesMap[slug]!}
              mainBody={mainBodiesMap[slug]!}
              currentBranchRef={currentBranchRef}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default EdgeFunctionsDiffPanel
