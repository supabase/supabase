import { useIsPgDeltaDiffEnabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { useBranchDiffQuery } from 'data/branches/branch-diff-query'
import { useMigrationsQuery } from 'data/database/migrations-query'
import { useMemo } from 'react'
import { useEdgeFunctionsDiff, type EdgeFunctionsDiffResult } from './useEdgeFunctionsDiff'

interface UseBranchMergeDiffProps {
  currentBranchRef?: string
  parentProjectRef?: string
  currentBranchConnectionString?: string
  parentBranchConnectionString?: string
  currentBranchCreatedAt?: string
}

export interface BranchMergeDiffResult {
  // Database diff
  diffContent: string | undefined
  isDatabaseDiffLoading: boolean
  isDatabaseDiffRefetching: boolean
  databaseDiffError: any
  refetchDatabaseDiff: () => void

  // Edge functions diff
  edgeFunctionsDiff: EdgeFunctionsDiffResult

  // Migrations
  currentBranchMigrations: any[] | undefined
  mainBranchMigrations: any[] | undefined
  refetchCurrentBranchMigrations: () => void
  refetchMainBranchMigrations: () => void

  // Branch state
  isBranchOutOfDateMigrations: boolean
  hasEdgeFunctionModifications: boolean
  missingFunctionsCount: number
  hasMissingFunctions: boolean
  outOfDateFunctionsCount: number
  hasOutOfDateFunctions: boolean
  isBranchOutOfDateOverall: boolean
  missingMigrationsCount: number
  modifiedFunctionsCount: number

  // Combined states
  isLoading: boolean
  hasChanges: boolean
}

export const useBranchMergeDiff = ({
  currentBranchRef,
  parentProjectRef,
  currentBranchConnectionString,
  parentBranchConnectionString,
  currentBranchCreatedAt,
}: UseBranchMergeDiffProps): BranchMergeDiffResult => {
  const pgDeltaDiffEnabled = useIsPgDeltaDiffEnabled()

  // Get database diff
  const {
    data: diffContent,
    isPending: isDatabaseDiffLoading,
    isRefetching: isDatabaseDiffRefetching,
    error: databaseDiffError,
    refetch: refetchDatabaseDiff,
  } = useBranchDiffQuery(
    {
      branchRef: currentBranchRef || '',
      projectRef: parentProjectRef || '',
      pgdelta: pgDeltaDiffEnabled,
    },
    {
      enabled: !!currentBranchRef && !!parentProjectRef,
      refetchOnMount: 'always',
      refetchOnWindowFocus: false,
      staleTime: 0,
    }
  )

  // Get migrations for both current branch and main branch
  const { data: currentBranchMigrations, refetch: refetchCurrentBranchMigrations } =
    useMigrationsQuery(
      {
        projectRef: currentBranchRef,
        connectionString: currentBranchConnectionString,
      },
      {
        enabled: !!currentBranchRef,
        staleTime: 3000,
      }
    )

  const { data: mainBranchMigrations, refetch: refetchMainBranchMigrations } = useMigrationsQuery(
    {
      projectRef: parentProjectRef,
      connectionString: parentBranchConnectionString,
    },
    {
      enabled: !!parentProjectRef,
      staleTime: 3000,
    }
  )

  // Get edge functions diff
  const edgeFunctionsDiff = useEdgeFunctionsDiff({
    currentBranchRef,
    mainBranchRef: parentProjectRef,
  })

  // Check if current branch is out of date with main branch (migrations)
  const isBranchOutOfDateMigrations = useMemo(() => {
    if (!currentBranchMigrations || !mainBranchMigrations) return false

    // Get the latest migration version from main branch
    const latestMainMigration = mainBranchMigrations[0] // migrations are ordered by version desc
    if (!latestMainMigration) return false

    // Check if current branch has this latest migration
    const hasLatestMigration = currentBranchMigrations.some(
      (migration) => migration.version === latestMainMigration.version
    )

    return !hasLatestMigration
  }, [currentBranchMigrations, mainBranchMigrations])

  // Check if main branch has functions that are newer than the current branch versions
  const outOfDateFunctionsCount = useMemo(() => {
    if (!edgeFunctionsDiff.modifiedSlugs.length) return 0

    return edgeFunctionsDiff.modifiedSlugs.filter((slug) => {
      // Get both main and current branch function data
      const mainFunction = edgeFunctionsDiff.mainBranchFunctions?.find((func) => func.slug === slug)
      const currentFunction = edgeFunctionsDiff.currentBranchFunctions?.find(
        (func) => func.slug === slug
      )

      if (!mainFunction || !currentFunction) return false

      // Compare updated_at timestamps - if main branch function is newer, it was modified after current branch
      const mainUpdatedAt = mainFunction.updated_at * 1000 // Convert to milliseconds
      const currentUpdatedAt = currentFunction.updated_at * 1000 // Convert to milliseconds

      return mainUpdatedAt > currentUpdatedAt
    }).length
  }, [
    edgeFunctionsDiff.modifiedSlugs,
    edgeFunctionsDiff.mainBranchFunctions,
    edgeFunctionsDiff.currentBranchFunctions,
  ])

  // Check if main branch has functions that are newer than the current branch versions
  const hasOutOfDateFunctions = outOfDateFunctionsCount > 0

  // Check if current branch has any edge function modifications (not additions/removals)
  // This only includes functions where the current branch version is newer than the main branch version
  const hasEdgeFunctionModifications =
    edgeFunctionsDiff.modifiedSlugs.length > outOfDateFunctionsCount

  // Count of removed functions that were updated on main branch after this branch was created
  // Note: For removed functions, we use branch creation date since there's no current branch version to compare to
  const missingFunctionsCount = useMemo(() => {
    if (!currentBranchCreatedAt || !edgeFunctionsDiff.removedSlugs.length) return 0

    const branchCreatedAt = new Date(currentBranchCreatedAt).getTime()

    return edgeFunctionsDiff.removedSlugs.filter((slug) => {
      // Access main branch function data from the original functions list
      const mainFunction = edgeFunctionsDiff.mainBranchFunctions?.find((func) => func.slug === slug)
      if (!mainFunction) return false

      // Check if function was updated after branch creation
      const functionUpdatedAt = mainFunction.updated_at * 1000 // Convert to milliseconds
      return functionUpdatedAt > branchCreatedAt
    }).length
  }, [
    currentBranchCreatedAt,
    edgeFunctionsDiff.removedSlugs,
    edgeFunctionsDiff.mainBranchFunctions,
  ])

  // Check if main branch has functions removed from current branch that were updated after branch creation
  const hasMissingFunctions = missingFunctionsCount > 0

  // Update overall out-of-date check to include newer removed functions and newer modified functions
  const isBranchOutOfDateOverall =
    isBranchOutOfDateMigrations || hasMissingFunctions || hasOutOfDateFunctions

  // Get the count of migrations that the branch is missing
  const missingMigrationsCount = useMemo(() => {
    if (!currentBranchMigrations || !mainBranchMigrations || !isBranchOutOfDateMigrations) return 0

    const currentVersions = new Set(currentBranchMigrations.map((m) => m.version))
    return mainBranchMigrations.filter((m) => !currentVersions.has(m.version)).length
  }, [currentBranchMigrations, mainBranchMigrations, isBranchOutOfDateMigrations])

  // Get count of modified functions
  const modifiedFunctionsCount = edgeFunctionsDiff.modifiedSlugs.length

  // Check if there are any changes (database or edge functions)
  const hasChanges = useMemo(() => {
    // Check database changes
    const hasDatabaseChanges = diffContent && diffContent.trim() !== ''

    // Check edge function changes
    const hasEdgeFunctionChanges = edgeFunctionsDiff.hasChanges

    return hasDatabaseChanges || hasEdgeFunctionChanges
  }, [diffContent, edgeFunctionsDiff.hasChanges])

  const isLoading = isDatabaseDiffLoading || edgeFunctionsDiff.isLoading

  return {
    // Database diff
    diffContent,
    isDatabaseDiffLoading,
    isDatabaseDiffRefetching,
    databaseDiffError,
    refetchDatabaseDiff,

    // Edge functions diff
    edgeFunctionsDiff,

    // Migrations
    currentBranchMigrations,
    mainBranchMigrations,
    refetchCurrentBranchMigrations,
    refetchMainBranchMigrations,

    // Branch state
    isBranchOutOfDateMigrations,
    hasEdgeFunctionModifications,
    missingFunctionsCount,
    hasMissingFunctions,
    outOfDateFunctionsCount,
    hasOutOfDateFunctions,
    isBranchOutOfDateOverall,
    missingMigrationsCount,
    modifiedFunctionsCount,

    // Combined states
    isLoading,
    hasChanges,
  }
}
