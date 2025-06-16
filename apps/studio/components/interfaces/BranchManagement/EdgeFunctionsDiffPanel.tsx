import { DiffEditor } from '@monaco-editor/react'
import { editor as monacoEditor } from 'monaco-editor'
import {
  getEdgeFunctionBody,
  type EdgeFunctionBodyData,
} from 'data/edge-functions/edge-function-body-query'
import type { EdgeFunctionsData } from 'data/edge-functions/edge-functions-query'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  cn,
  Skeleton,
  Tabs_Shadcn_,
  TabsList_Shadcn_,
  TabsTrigger_Shadcn_,
} from 'ui'
import { Code, Wind } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useQueries } from '@tanstack/react-query'

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
const fileKey = (fullPath: string) => fullPath.split('/').pop() ?? fullPath

const FunctionDiff = ({
  functionSlug,
  currentBody,
  mainBody,
  currentBranchRef,
}: FunctionDiffProps) => {
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
      <CardHeader className="space-y-0">
        {/* Function title */}
        <Link
          href={`/project/${currentBranchRef}/functions/${functionSlug}`}
          className="text-sm text-foreground-light flex items-center gap-2"
        >
          <Code strokeWidth={1.5} size={16} className="text-foreground-light" />
          {functionSlug}
        </Link>

        {/* File tabs */}
        {diffFileKeys.length > 1 && (
          <Tabs_Shadcn_
            value={activeFileKey ?? diffFileKeys[0]}
            onValueChange={(v: string) => setActiveFileKey(v)}
          >
            <TabsList_Shadcn_ className="gap-4 overflow-x-auto border-b-0 -mx-6 -mb-4 mt-1 px-6">
              {diffFileKeys.map((key) => (
                <TabsTrigger_Shadcn_ key={key} value={key}>
                  {key}
                </TabsTrigger_Shadcn_>
              ))}
            </TabsList_Shadcn_>
          </Tabs_Shadcn_>
        )}
      </CardHeader>
      <CardContent className="p-0 h-96">
        <DiffEditor
          theme="supabase"
          language={language}
          height="100%"
          original={mainFile?.content || ''}
          modified={currentFile?.content || ''}
          options={defaultOptions}
        />
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
  // Compare edge functions between branches for added/removed and potential overlap
  const compareEdgeFunctions = () => {
    if (!currentBranchFunctions || !mainBranchFunctions) {
      return { added: [], removed: [], overlap: [] as typeof currentBranchFunctions }
    }

    const currentFuncs = currentBranchFunctions || []
    const mainFuncs = mainBranchFunctions || []

    const added = currentFuncs.filter(
      (currentFunc) => !mainFuncs.find((mainFunc) => mainFunc.slug === currentFunc.slug)
    )

    const removed = mainFuncs.filter(
      (mainFunc) => !currentFuncs.find((currentFunc) => currentFunc.slug === mainFunc.slug)
    )

    // Functions that exist in both branches are potential modifications
    const overlap = currentFuncs.filter((currentFunc) =>
      mainFuncs.find((f) => f.slug === currentFunc.slug)
    )

    return { added, removed, overlap }
  }

  const {
    added = [],
    removed = [],
    overlap = [],
  } = useMemo(compareEdgeFunctions, [currentBranchFunctions, mainBranchFunctions])

  // Fetch bodies for overlapping functions in both branches
  const overlapSlugs = overlap.map((f) => f.slug)

  // FIRST_EDIT: introduce slug arrays for added and removed
  const addedSlugs = added.map((f) => f.slug)
  const removedSlugs = removed.map((f) => f.slug)

  const currentBodiesQueries = useQueries({
    queries: overlapSlugs.map((slug) => ({
      queryKey: ['edge-function-body', currentBranchRef, slug],
      queryFn: ({ signal }: { signal?: AbortSignal }) =>
        getEdgeFunctionBody({ projectRef: currentBranchRef, slug }, signal),
      enabled: !!currentBranchRef,
    })),
  })

  const mainBodiesQueries = useQueries({
    queries: overlapSlugs.map((slug) => ({
      queryKey: ['edge-function-body', mainBranchRef, slug],
      queryFn: ({ signal }: { signal?: AbortSignal }) =>
        getEdgeFunctionBody({ projectRef: mainBranchRef, slug }, signal),
      enabled: !!mainBranchRef,
    })),
  })

  // SECOND_EDIT: fetch bodies for added and removed functions
  const addedBodiesQueries = useQueries({
    queries: addedSlugs.map((slug) => ({
      queryKey: ['edge-function-body', currentBranchRef, slug],
      queryFn: ({ signal }: { signal?: AbortSignal }) =>
        getEdgeFunctionBody({ projectRef: currentBranchRef, slug }, signal),
      enabled: !!currentBranchRef,
    })),
  })

  const removedBodiesQueries = useQueries({
    queries: removedSlugs.map((slug) => ({
      queryKey: ['edge-function-body', mainBranchRef, slug],
      queryFn: ({ signal }: { signal?: AbortSignal }) =>
        getEdgeFunctionBody({ projectRef: mainBranchRef, slug }, signal),
      enabled: !!mainBranchRef,
    })),
  })

  // THIRD_EDIT: include added/removed loading status
  const isBodiesLoading =
    currentBodiesQueries.some((q) => q.isLoading) ||
    mainBodiesQueries.some((q) => q.isLoading) ||
    addedBodiesQueries.some((q) => q.isLoading) ||
    removedBodiesQueries.some((q) => q.isLoading)

  const currentBodiesMap: Record<string, EdgeFunctionBodyData | undefined> = {}
  currentBodiesQueries.forEach((q, idx) => {
    if (q.data) currentBodiesMap[overlapSlugs[idx]] = q.data
  })

  const mainBodiesMap: Record<string, EdgeFunctionBodyData | undefined> = {}
  mainBodiesQueries.forEach((q, idx) => {
    if (q.data) mainBodiesMap[overlapSlugs[idx]] = q.data
  })

  // FOURTH_EDIT: build bodies map for added and removed slugs
  const addedBodiesMap: Record<string, EdgeFunctionBodyData | undefined> = {}
  addedBodiesQueries.forEach((q, idx) => {
    if (q.data) addedBodiesMap[addedSlugs[idx]] = q.data
  })

  const removedBodiesMap: Record<string, EdgeFunctionBodyData | undefined> = {}
  removedBodiesQueries.forEach((q, idx) => {
    if (q.data) removedBodiesMap[removedSlugs[idx]] = q.data
  })

  // Determine which overlapping functions actually have modifications in any of their files
  const modifiedSlugs = overlapSlugs.filter((slug) => {
    const currentBody = currentBodiesMap[slug]
    const mainBody = mainBodiesMap[slug]
    if (!currentBody || !mainBody) return false

    const keys = new Set([...currentBody, ...mainBody].map((f) => fileKey(f.name)))

    for (const key of keys) {
      const currentFile = currentBody.find((f) => fileKey(f.name) === key)
      const mainFile = mainBody.find((f) => fileKey(f.name) === key)
      if ((currentFile?.content || '') !== (mainFile?.content || '')) {
        return true
      }
    }

    return false
  })

  const hasChanges = added.length > 0 || removed.length > 0 || modifiedSlugs.length > 0

  if (isCurrentFunctionsLoading || isMainFunctionsLoading || isBodiesLoading) {
    return <Skeleton className="h-64" />
  }

  // If no changes and checking complete
  if (!hasChanges) {
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
      {added.length > 0 && (
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

      {removed.length > 0 && (
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
