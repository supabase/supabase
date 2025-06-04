import { DiffEditor } from '@monaco-editor/react'
import { editor as monacoEditor } from 'monaco-editor'
import { useEdgeFunctionBodyQuery } from 'data/edge-functions/edge-function-body-query'
import type { EdgeFunctionsData } from 'data/edge-functions/edge-functions-query'

interface EdgeFunctionsDiffPanelProps {
  currentBranchFunctions?: EdgeFunctionsData
  mainBranchFunctions?: EdgeFunctionsData
  isCurrentFunctionsLoading: boolean
  isMainFunctionsLoading: boolean
  currentBranchRef?: string
  mainBranchRef?: string
}

interface FunctionChange {
  added: EdgeFunctionsData
  removed: EdgeFunctionsData
  modified: EdgeFunctionsData
}

interface FunctionDiffProps {
  functionSlug: string
  currentBranchRef?: string
  mainBranchRef?: string
}

const FunctionDiff = ({ functionSlug, currentBranchRef, mainBranchRef }: FunctionDiffProps) => {
  const {
    data: currentFunctionBody,
    isLoading: isCurrentLoading,
    error: currentError,
    isError: isCurrentError,
    isSuccess: isCurrentSuccess,
  } = useEdgeFunctionBodyQuery(
    { projectRef: currentBranchRef, slug: functionSlug },
    {
      enabled: !!currentBranchRef && !!functionSlug,
      retry: false,
      retryOnMount: false,
      refetchOnWindowFocus: false,
    }
  )

  const {
    data: mainFunctionBody,
    isLoading: isMainLoading,
    error: mainError,
    isError: isMainError,
    isSuccess: isMainSuccess,
  } = useEdgeFunctionBodyQuery(
    { projectRef: mainBranchRef, slug: functionSlug },
    {
      enabled: !!mainBranchRef && !!functionSlug,
      retry: false,
      retryOnMount: false,
      refetchOnWindowFocus: false,
    }
  )

  // Monaco editor options for diff display
  const defaultOptions: monacoEditor.IStandaloneDiffEditorConstructionOptions = {
    readOnly: true,
    renderSideBySide: true,
    minimap: { enabled: false },
    wordWrap: 'on',
    lineNumbers: 'on',
    folding: false,
    padding: { top: 16, bottom: 16 },
    lineNumbersMinChars: 3,
    fontSize: 13,
    scrollBeyondLastLine: false,
  }

  // Debug info
  console.log('FunctionDiff Debug:', {
    functionSlug,
    currentBranchRef,
    mainBranchRef,
    isCurrentLoading,
    isMainLoading,
    isCurrentError,
    isMainError,
    isCurrentSuccess,
    isMainSuccess,
    currentError: currentError?.message,
    mainError: mainError?.message,
    currentFunctionBody: !!currentFunctionBody,
    mainFunctionBody: !!mainFunctionBody,
  })

  // Handle errors
  if (isCurrentError || isMainError) {
    return (
      <div className="border rounded-lg overflow-hidden mb-4">
        <div className="bg-gray-50 px-4 py-2 border-b">
          <h4 className="font-mono text-sm font-medium">{functionSlug}</h4>
        </div>
        <div className="p-4 text-center text-red-500">
          <p>Error loading function code:</p>
          {currentError && <p className="text-sm">Current branch: {currentError.message}</p>}
          {mainError && <p className="text-sm">Main branch: {mainError.message}</p>}
          <div className="text-xs text-gray-400 mt-2">
            <p>Current branch ref: {currentBranchRef}</p>
            <p>Main branch ref: {mainBranchRef}</p>
          </div>
        </div>
      </div>
    )
  }

  // Handle loading
  if (isCurrentLoading || isMainLoading) {
    return (
      <div className="border rounded-lg overflow-hidden mb-4">
        <div className="bg-gray-50 px-4 py-2 border-b">
          <h4 className="font-mono text-sm font-medium">{functionSlug}</h4>
        </div>
        <div className="p-4 text-center">
          <p>Loading function code...</p>
          <p className="text-sm text-gray-500 mt-1">
            Current: {isCurrentLoading ? 'Loading...' : isCurrentSuccess ? 'Loaded' : 'Error'} |
            Main: {isMainLoading ? 'Loading...' : isMainSuccess ? 'Loaded' : 'Error'}
          </p>
          <div className="text-xs text-gray-400 mt-2">
            <p>Function: {functionSlug}</p>
            <p>Current ref: {currentBranchRef}</p>
            <p>Main ref: {mainBranchRef}</p>
          </div>
        </div>
      </div>
    )
  }

  // Handle missing data after successful queries
  if ((isCurrentSuccess && !currentFunctionBody) || (isMainSuccess && !mainFunctionBody)) {
    return (
      <div className="border rounded-lg overflow-hidden mb-4">
        <div className="bg-gray-50 px-4 py-2 border-b">
          <h4 className="font-mono text-sm font-medium">{functionSlug}</h4>
        </div>
        <div className="p-4 text-center text-amber-600">
          <p>Function code not available</p>
          <p className="text-sm text-gray-500 mt-1">
            Current branch:{' '}
            {isCurrentSuccess
              ? currentFunctionBody
                ? 'Available'
                : 'Empty response'
              : 'Not loaded'}{' '}
            | Main branch:{' '}
            {isMainSuccess ? (mainFunctionBody ? 'Available' : 'Empty response') : 'Not loaded'}
          </p>
          <div className="text-xs text-gray-400 mt-2">
            <p>Function: {functionSlug}</p>
            <p>Current ref: {currentBranchRef}</p>
            <p>Main ref: {mainBranchRef}</p>
          </div>
        </div>
      </div>
    )
  }

  // Both queries must be successful and have data to proceed
  if (!isCurrentSuccess || !isMainSuccess || !currentFunctionBody || !mainFunctionBody) {
    return (
      <div className="border rounded-lg overflow-hidden mb-4">
        <div className="bg-gray-50 px-4 py-2 border-b">
          <h4 className="font-mono text-sm font-medium">{functionSlug}</h4>
        </div>
        <div className="p-4 text-center">
          <p>Waiting for function data...</p>
          <div className="text-xs text-gray-400 mt-2">
            <p>Current success: {isCurrentSuccess ? 'Yes' : 'No'}</p>
            <p>Main success: {isMainSuccess ? 'Yes' : 'No'}</p>
          </div>
        </div>
      </div>
    )
  }

  // Get the main file content (usually index.ts/js)
  const currentMainFile =
    currentFunctionBody.find((f) => f.name.includes('index.')) || currentFunctionBody[0]
  const mainMainFile =
    mainFunctionBody.find((f) => f.name.includes('index.')) || mainFunctionBody[0]

  return (
    <div className="border rounded-lg overflow-hidden mb-4">
      <div className="bg-gray-50 px-4 py-2 border-b">
        <h4 className="font-mono text-sm font-medium">{functionSlug}</h4>
        <div className="text-xs text-gray-500">
          Files: {currentFunctionBody.length} current, {mainFunctionBody.length} main
        </div>
      </div>
      <div className="h-64">
        <DiffEditor
          theme="supabase"
          language="typescript"
          height="100%"
          original={mainMainFile?.content || ''}
          modified={currentMainFile?.content || ''}
          options={defaultOptions}
        />
      </div>
    </div>
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
  // Compare edge functions between branches
  const compareEdgeFunctions = (): FunctionChange => {
    if (!currentBranchFunctions || !mainBranchFunctions) {
      return { added: [], removed: [], modified: [] }
    }

    const currentFuncs = currentBranchFunctions || []
    const mainFuncs = mainBranchFunctions || []

    const added = currentFuncs.filter(
      (currentFunc) => !mainFuncs.find((mainFunc) => mainFunc.slug === currentFunc.slug)
    )

    const removed = mainFuncs.filter(
      (mainFunc) => !currentFuncs.find((currentFunc) => currentFunc.slug === mainFunc.slug)
    )

    // Consider a function modified if it exists in both branches and has more than 1 deployment in current branch
    const modified = currentFuncs.filter((currentFunc) => {
      const mainFunc = mainFuncs.find((f) => f.slug === currentFunc.slug)
      return mainFunc && currentFunc.version > 1
    })

    return { added, removed, modified }
  }

  const { added, removed, modified } = compareEdgeFunctions()

  if (isCurrentFunctionsLoading || isMainFunctionsLoading) {
    return (
      <div className="p-6 text-center">
        <p>Loading edge functions...</p>
      </div>
    )
  }

  const hasChanges = added.length > 0 || removed.length > 0 || modified.length > 0

  if (!hasChanges) {
    return (
      <div className="p-6 text-center">
        <p>No edge function changes detected between branches</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {added.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-green-600 mb-3">
            Added Functions ({added.length})
          </h3>
          <div className="space-y-2">
            {added.map((func) => (
              <div key={func.slug} className="border rounded-lg p-4 bg-green-50">
                <div className="font-mono text-sm font-medium">{func.slug}</div>
                <div className="text-sm text-gray-600">Deployments: {func.version}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {removed.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-red-600 mb-3">
            Removed Functions ({removed.length})
          </h3>
          <div className="space-y-2">
            {removed.map((func) => (
              <div key={func.slug} className="border rounded-lg p-4 bg-red-50">
                <div className="font-mono text-sm font-medium">{func.slug}</div>
                <div className="text-sm text-gray-600">Deployments: {func.version}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {modified.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-blue-600 mb-3">
            Modified Functions ({modified.length})
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Functions with more than 1 deployment in the current branch
          </p>
          <div className="space-y-4">
            {modified.map((func) => (
              <FunctionDiff
                key={func.slug}
                functionSlug={func.slug}
                currentBranchRef={currentBranchRef}
                mainBranchRef={mainBranchRef}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default EdgeFunctionsDiffPanel
