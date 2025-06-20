import { useMemo } from 'react'
import { useQueries } from '@tanstack/react-query'
import { handleError } from 'data/fetchers'
import {
  getEdgeFunctionBody,
  type EdgeFunctionBodyData,
} from 'data/edge-functions/edge-function-body-query'
import type { EdgeFunctionsData } from 'data/edge-functions/edge-functions-query'
import { basename } from 'path'

interface UseEdgeFunctionsDiffProps {
  currentBranchFunctions?: EdgeFunctionsData
  mainBranchFunctions?: EdgeFunctionsData
  currentBranchRef?: string
  mainBranchRef?: string
}

export type FileStatus = 'added' | 'removed' | 'modified' | 'unchanged'

export interface FileInfo {
  key: string
  status: FileStatus
}

export interface FunctionFileInfo {
  [functionSlug: string]: FileInfo[]
}

export interface EdgeFunctionsDiffResult {
  addedSlugs: string[]
  removedSlugs: string[]
  modifiedSlugs: string[]
  addedBodiesMap: Record<string, EdgeFunctionBodyData | undefined>
  removedBodiesMap: Record<string, EdgeFunctionBodyData | undefined>
  currentBodiesMap: Record<string, EdgeFunctionBodyData | undefined>
  mainBodiesMap: Record<string, EdgeFunctionBodyData | undefined>
  functionFileInfo: FunctionFileInfo
  isLoading: boolean
  hasChanges: boolean
}

// Small helper around path.basename but avoids importing the full Node path lib for the browser bundle
const fileKey = (fullPath: string) => basename(fullPath)

export const useEdgeFunctionsDiff = ({
  currentBranchFunctions,
  mainBranchFunctions,
  currentBranchRef,
  mainBranchRef,
}: UseEdgeFunctionsDiffProps): EdgeFunctionsDiffResult => {
  // Identify added / removed / overlapping functions
  const {
    added = [],
    removed = [],
    overlap = [],
  } = useMemo(() => {
    if (!currentBranchFunctions || !mainBranchFunctions) {
      return { added: [], removed: [], overlap: [] as typeof currentBranchFunctions }
    }

    const currentFuncs = currentBranchFunctions ?? []
    const mainFuncs = mainBranchFunctions ?? []

    const added = currentFuncs.filter((c) => !mainFuncs.find((m) => m.slug === c.slug))
    const removed = mainFuncs.filter((m) => !currentFuncs.find((c) => c.slug === m.slug))
    const overlap = currentFuncs.filter((c) => mainFuncs.find((m) => m.slug === c.slug))

    return { added, removed, overlap }
  }, [currentBranchFunctions, mainBranchFunctions])

  const overlapSlugs = overlap.map((f) => f.slug)
  const addedSlugs = added.map((f) => f.slug)
  const removedSlugs = removed.map((f) => f.slug)

  // Fetch function bodies ---------------------------------------------------
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

  // Flatten loading flags ----------------------------------------------------
  const isLoading = [
    ...currentBodiesQueries,
    ...mainBodiesQueries,
    ...addedBodiesQueries,
    ...removedBodiesQueries,
  ].some((q) => q.isLoading)

  // Aggregate errors across all queries and handle the first encountered error.
  const firstError = [
    ...currentBodiesQueries,
    ...mainBodiesQueries,
    ...addedBodiesQueries,
    ...removedBodiesQueries,
  ].find((q) => q.error)?.error

  if (firstError) {
    handleError(firstError)
  }

  // Build lookup maps --------------------------------------------------------
  const currentBodiesMap: Record<string, EdgeFunctionBodyData | undefined> = {}
  currentBodiesQueries.forEach((q, idx) => {
    if (q.data) currentBodiesMap[overlapSlugs[idx]] = q.data
  })

  const mainBodiesMap: Record<string, EdgeFunctionBodyData | undefined> = {}
  mainBodiesQueries.forEach((q, idx) => {
    if (q.data) mainBodiesMap[overlapSlugs[idx]] = q.data
  })

  const addedBodiesMap: Record<string, EdgeFunctionBodyData | undefined> = {}
  addedBodiesQueries.forEach((q, idx) => {
    if (q.data) addedBodiesMap[addedSlugs[idx]] = q.data
  })

  const removedBodiesMap: Record<string, EdgeFunctionBodyData | undefined> = {}
  removedBodiesQueries.forEach((q, idx) => {
    if (q.data) removedBodiesMap[removedSlugs[idx]] = q.data
  })

  // Determine modified slugs and build file info -----------------------------
  const modifiedSlugs: string[] = []
  const functionFileInfo: FunctionFileInfo = {}

  // Process overlapping functions to determine modifications and file info
  overlapSlugs.forEach((slug) => {
    const currentBody = currentBodiesMap[slug]
    const mainBody = mainBodiesMap[slug]
    if (!currentBody || !mainBody) return

    const allFileKeys = new Set([...currentBody, ...mainBody].map((f) => fileKey(f.name)))
    const fileInfos: FileInfo[] = []
    let hasModifications = false

    for (const key of allFileKeys) {
      const currentFile = currentBody.find((f) => fileKey(f.name) === key)
      const mainFile = mainBody.find((f) => fileKey(f.name) === key)

      let status: FileStatus = 'unchanged'

      if (!currentFile && mainFile) {
        status = 'removed'
        hasModifications = true
      } else if (currentFile && !mainFile) {
        status = 'added'
        hasModifications = true
      } else if (currentFile && mainFile && currentFile.content !== mainFile.content) {
        status = 'modified'
        hasModifications = true
      }

      fileInfos.push({ key, status })
    }

    if (hasModifications) {
      modifiedSlugs.push(slug)
    }

    functionFileInfo[slug] = fileInfos
  })

  // Add file info for added functions
  addedSlugs.forEach((slug) => {
    const body = addedBodiesMap[slug]
    if (body) {
      functionFileInfo[slug] = body.map((file) => ({
        key: fileKey(file.name),
        status: 'added' as FileStatus,
      }))
    }
  })

  // Add file info for removed functions
  removedSlugs.forEach((slug) => {
    const body = removedBodiesMap[slug]
    if (body) {
      functionFileInfo[slug] = body.map((file) => ({
        key: fileKey(file.name),
        status: 'removed' as FileStatus,
      }))
    }
  })

  const hasChanges = addedSlugs.length > 0 || removedSlugs.length > 0 || modifiedSlugs.length > 0

  return {
    addedSlugs,
    removedSlugs,
    modifiedSlugs,
    addedBodiesMap,
    removedBodiesMap,
    currentBodiesMap,
    mainBodiesMap,
    functionFileInfo,
    isLoading,
    hasChanges,
  }
}

export default useEdgeFunctionsDiff
