import { useState, useMemo } from 'react'
import { useRouter } from 'next/router'
import { DiffEditor } from '@monaco-editor/react'
import { editor as monacoEditor } from 'monaco-editor'

import { useParams } from 'common'
import { ProjectLayoutWithAuth } from 'components/layouts/ProjectLayout/ProjectLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { useBranchesQuery } from 'data/branches/branches-query'
import { useBranchMergeMutation } from 'data/branches/branch-merge-mutation'
import { useProjectDetailQuery } from 'data/projects/project-detail-query'
import { useBranchDatabaseComparison } from 'hooks/misc/useBranchDatabaseComparison'
import { useEdgeFunctionsQuery } from 'data/edge-functions/edge-functions-query'
import { useEdgeFunctionBodyQuery } from 'data/edge-functions/edge-function-body-query'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Tabs_Shadcn_,
  TabsContent_Shadcn_,
  TabsList_Shadcn_,
  TabsTrigger_Shadcn_,
} from 'ui'
import { toast } from 'sonner'
import type { NextPageWithLayout } from 'types'
import { ScaffoldContainer } from 'components/layouts/Scaffold'
import { Code, Table, Plus, Minus, Edit } from 'lucide-react'

const MergePage: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref } = useParams()
  const project = useSelectedProject()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isBranch = project?.parent_project_ref !== undefined
  const parentProjectRef = project?.parent_project_ref

  // Get main project details using the parent_project_ref
  const { data: mainProject } = useProjectDetailQuery(
    { ref: parentProjectRef },
    { enabled: !!parentProjectRef }
  )

  // Get branch information
  const { data: branches } = useBranchesQuery({ projectRef: parentProjectRef })
  const currentBranch = branches?.find((branch) => branch.project_ref === ref)
  const mainBranch = branches?.find((branch) => branch.is_default)

  // Debug logging for branch setup
  console.log('🌿 Branch Setup Debug:', {
    currentRef: ref,
    parentProjectRef,
    isBranch,
    mainProject: mainProject
      ? {
          ref: mainProject.ref,
          connectionString: mainProject.connectionString,
        }
      : null,
    currentProject: project
      ? {
          ref: project.ref,
          connectionString: project.connectionString,
        }
      : null,
    branches: branches?.map((b) => ({
      name: b.name,
      projectRef: b.project_ref,
      isDefault: b.is_default,
    })),
    currentBranch: currentBranch
      ? {
          name: currentBranch.name,
          projectRef: currentBranch.project_ref,
          isDefault: currentBranch.is_default,
        }
      : null,
    mainBranch: mainBranch
      ? {
          name: mainBranch.name,
          projectRef: mainBranch.project_ref,
          isDefault: mainBranch.is_default,
        }
      : null,
  })

  // Get database comparison using main project details
  const databaseComparison = useBranchDatabaseComparison({
    mainBranchProjectRef: parentProjectRef, // Use parent project ref for main branch
    currentBranchProjectRef: ref, // Use current branch ref
    mainBranchConnectionString: mainProject?.connectionString, // Main project uses default connection (no special header)
    currentBranchConnectionString: project?.connectionString, // Use current branch's connection
  })

  // Get edge functions for both branches
  const { data: mainBranchFunctions, isLoading: isLoadingMainFunctions } = useEdgeFunctionsQuery(
    { projectRef: parentProjectRef },
    { enabled: !!parentProjectRef }
  )

  const { data: currentBranchFunctions, isLoading: isLoadingCurrentFunctions } =
    useEdgeFunctionsQuery({ projectRef: ref }, { enabled: !!ref })

  // Compare functions between branches
  const functionsComparison = useMemo(() => {
    const mainFunctions = mainBranchFunctions || []
    const currentFunctions = currentBranchFunctions || []

    const mainFunctionMap = new Map(mainFunctions.map((f) => [f.slug, f]))
    const currentFunctionMap = new Map(currentFunctions.map((f) => [f.slug, f]))

    const allFunctionSlugs = new Set([
      ...mainFunctions.map((f) => f.slug),
      ...currentFunctions.map((f) => f.slug),
    ])

    const comparisonResults = Array.from(allFunctionSlugs).map((slug) => {
      const mainFunction = mainFunctionMap.get(slug)
      const currentFunction = currentFunctionMap.get(slug)

      let status: 'added' | 'removed' | 'modified' | 'unchanged' = 'unchanged'

      if (!mainFunction && currentFunction) {
        status = 'added'
      } else if (mainFunction && !currentFunction) {
        status = 'removed'
      } else if (mainFunction && currentFunction) {
        // Compare basic function metadata to determine if potentially modified
        // Note: We'll need to fetch function bodies for detailed comparison
        const isModified =
          mainFunction.name !== currentFunction.name ||
          mainFunction.version !== currentFunction.version ||
          mainFunction.updated_at !== currentFunction.updated_at

        status = isModified ? 'modified' : 'unchanged'
      }

      return {
        slug,
        name: currentFunction?.name || mainFunction?.name || slug,
        status,
        mainFunction,
        currentFunction,
      }
    })

    console.log('🔧 Functions Comparison:', {
      mainFunctionsCount: mainFunctions.length,
      currentFunctionsCount: currentFunctions.length,
      totalComparisons: comparisonResults.length,
      byStatus: {
        added: comparisonResults.filter((f) => f.status === 'added').length,
        removed: comparisonResults.filter((f) => f.status === 'removed').length,
        modified: comparisonResults.filter((f) => f.status === 'modified').length,
        unchanged: comparisonResults.filter((f) => f.status === 'unchanged').length,
      },
    })

    return comparisonResults
  }, [mainBranchFunctions, currentBranchFunctions])

  // Filter functions to show only those with changes
  const functionsWithChanges = useMemo(() => {
    return functionsComparison.filter((func) => func.status !== 'unchanged')
  }, [functionsComparison])

  // Filter tables to show only those with changes or potential changes in public schema
  const tablesWithChanges = useMemo(() => {
    const filtered = databaseComparison.tables.filter(
      (table) => table.status !== 'unchanged' && table.schemaName === 'public'
    )
    console.log('🎯 Public Schema Tables With Changes Filter:', {
      totalTables: databaseComparison.tables.length,
      publicSchemaTables: databaseComparison.tables.filter((t) => t.schemaName === 'public').length,
      filteredCount: filtered.length,
      allPublicTables: databaseComparison.tables
        .filter((t) => t.schemaName === 'public')
        .map((t) => ({
          name: `${t.schemaName}.${t.tableName}`,
          status: t.status,
        })),
      filtered: filtered.map((t) => ({
        name: `${t.schemaName}.${t.tableName}`,
        status: t.status,
      })),
    })
    return filtered
  }, [databaseComparison.tables])

  const { mutate: mergeBranch, isLoading: isMerging } = useBranchMergeMutation({
    onSuccess: () => {
      toast.success('Branch merged successfully!')
      if (parentProjectRef) {
        router.push(`/project/${parentProjectRef}`)
      }
    },
    onError: (error) => {
      toast.error(`Failed to merge branch: ${error.message}`)
    },
  })

  const handleMerge = () => {
    if (!currentBranch?.id || !parentProjectRef) return
    setIsSubmitting(true)
    mergeBranch({
      id: currentBranch.id,
      projectRef: parentProjectRef,
      migration_version: undefined,
    })
  }

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

  if (!isBranch || !currentBranch) {
    return (
      <PageLayout title="Merge Request">
        <div className="p-6">
          <p>This page is only available for preview branches.</p>
        </div>
      </PageLayout>
    )
  }

  const breadcrumbs = [
    {
      label: 'Branches',
      href: `/project/${parentProjectRef}/branches`,
    },
  ]

  const primaryActions = (
    <Button type="primary" loading={isMerging || isSubmitting} onClick={handleMerge}>
      Merge branch
    </Button>
  )

  const pageTitle = () => (
    <span>
      Merge <span className="font-mono">{currentBranch.name}</span> into{' '}
      <span className="font-mono">{mainBranch?.name || 'main'}</span>
    </span>
  )

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'added':
        return <Plus size={16} strokeWidth={1.5} className="text-brand" />
      case 'removed':
        return <Minus size={16} strokeWidth={1.5} className="text-destructive" />
      case 'modified':
        return <Edit size={16} strokeWidth={1.5} className="text-warning" />
      default:
        return <Table size={16} strokeWidth={1.5} className="text-foreground-light" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'added':
        return 'text-brand'
      case 'removed':
        return 'text-destructive'
      case 'modified':
        return 'text-warning'
      default:
        return 'text-foreground-light'
    }
  }

  return (
    <PageLayout
      title={pageTitle()}
      subtitle="Saxon created this branch 3 months ago"
      breadcrumbs={breadcrumbs}
      primaryActions={primaryActions}
    >
      <ScaffoldContainer className="pt-6">
        <Tabs_Shadcn_ defaultValue="schema">
          <TabsList_Shadcn_ className="gap-4 mb-8">
            <TabsTrigger_Shadcn_ value="schema" className="gap-2 pb-3">
              Database <Badge>{tablesWithChanges.length}</Badge>
            </TabsTrigger_Shadcn_>
            <TabsTrigger_Shadcn_ value="functions" className="gap-2 pb-3">
              Functions <Badge>{functionsWithChanges.length}</Badge>
            </TabsTrigger_Shadcn_>
            <TabsTrigger_Shadcn_ value="config" className="gap-2 pb-3">
              Configuration <Badge>0</Badge>
            </TabsTrigger_Shadcn_>
          </TabsList_Shadcn_>

          <TabsContent_Shadcn_ value="schema">
            {databaseComparison.isLoading ? (
              <div className="p-6 text-center">
                <p>Loading database comparison...</p>
              </div>
            ) : databaseComparison.isError ? (
              <div className="p-6 text-center text-red-500">
                <p>Error loading database comparison</p>
              </div>
            ) : tablesWithChanges.length === 0 ? (
              <div className="p-6 text-center">
                <p>No database changes detected between branches</p>
              </div>
            ) : (
              <div className="space-y-4">
                {tablesWithChanges.map((table) => (
                  <TableComparisonCard
                    key={`${table.schemaName}.${table.tableName}`}
                    table={table}
                    mainProjectRef={parentProjectRef}
                    currentProjectRef={ref}
                    mainConnectionString={undefined} // Main project uses default connection
                    currentConnectionString={project?.connectionString} // Use current branch's connection
                    defaultOptions={defaultOptions}
                    getStatusIcon={getStatusIcon}
                    getStatusColor={getStatusColor}
                  />
                ))}
              </div>
            )}
          </TabsContent_Shadcn_>

          <TabsContent_Shadcn_ value="functions">
            {isLoadingMainFunctions || isLoadingCurrentFunctions ? (
              <div className="p-6 text-center">
                <p>Loading edge functions comparison...</p>
              </div>
            ) : functionsWithChanges.length === 0 ? (
              <div className="p-6 text-center">
                <p>No function changes detected between branches</p>
              </div>
            ) : (
              <div className="space-y-4">
                {functionsWithChanges.map((func) => (
                  <FunctionComparisonCard
                    key={func.slug}
                    func={func}
                    mainProjectRef={parentProjectRef}
                    currentProjectRef={ref}
                    mainConnectionString={undefined} // Main project uses default connection
                    currentConnectionString={project?.connectionString} // Use current branch's connection
                    defaultOptions={defaultOptions}
                    getStatusIcon={getStatusIcon}
                    getStatusColor={getStatusColor}
                  />
                ))}
              </div>
            )}
          </TabsContent_Shadcn_>

          <TabsContent_Shadcn_ value="config" className="mt-4">
            <div className="p-6 text-center">
              <p>Configuration comparison not implemented yet</p>
            </div>
          </TabsContent_Shadcn_>
        </Tabs_Shadcn_>
      </ScaffoldContainer>
    </PageLayout>
  )
}

// Component for individual table comparison
interface TableComparisonCardProps {
  table: any
  mainProjectRef?: string
  currentProjectRef?: string
  mainConnectionString?: string | null
  currentConnectionString?: string | null
  defaultOptions: monacoEditor.IStandaloneDiffEditorConstructionOptions
  getStatusIcon: (status: string) => JSX.Element
  getStatusColor: (status: string) => string
}

const TableComparisonCard = ({
  table,
  mainProjectRef,
  currentProjectRef,
  mainConnectionString,
  currentConnectionString,
  defaultOptions,
  getStatusIcon,
  getStatusColor,
}: TableComparisonCardProps) => {
  // Generate SQL definitions from table data instead of using the hook
  const mainDefinition = table.mainTable
    ? tableToSQL(table.mainTable)
    : '-- Table does not exist in main branch'

  const currentDefinition = table.currentTable
    ? tableToSQL(table.currentTable)
    : '-- Table was removed in current branch'

  // Determine if the table is actually modified by comparing definitions
  const isModified =
    mainDefinition !== currentDefinition &&
    table.status === 'unchanged' &&
    table.mainTable &&
    table.currentTable

  // Determine actual status based on definitions
  const actualStatus = isModified ? 'modified' : table.status

  // Prepare diff content
  const originalContent =
    table.status === 'added' ? '-- Table does not exist in main branch' : mainDefinition

  const modifiedContent =
    table.status === 'removed' ? '-- Table was removed in current branch' : currentDefinition

  return (
    <Card>
      <CardHeader className="flex-row items-center py-3 px-4 gap-2 w-full space-y-0">
        {getStatusIcon(actualStatus)}
        <CardTitle className={getStatusColor(actualStatus)}>
          {table.schemaName}.{table.tableName}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-64">
          <DiffEditor
            theme="supabase"
            language="sql"
            height="100%"
            original={originalContent}
            modified={modifiedContent}
            options={defaultOptions}
          />
        </div>
      </CardContent>
    </Card>
  )
}

// Component for function comparison
interface FunctionComparisonCardProps {
  func: any
  mainProjectRef?: string
  currentProjectRef?: string
  mainConnectionString?: string | null
  currentConnectionString?: string | null
  defaultOptions: monacoEditor.IStandaloneDiffEditorConstructionOptions
  getStatusIcon: (status: string) => JSX.Element
  getStatusColor: (status: string) => string
}

const FunctionComparisonCard = ({
  func,
  mainProjectRef,
  currentProjectRef,
  mainConnectionString,
  currentConnectionString,
  defaultOptions,
  getStatusIcon,
  getStatusColor,
}: FunctionComparisonCardProps) => {
  // First, check if we need to fetch bodies by comparing metadata
  const needsBodyComparison = useMemo(() => {
    // Always need body comparison for added/removed functions for display
    if (func.status === 'added' || func.status === 'removed') {
      return true
    }

    // If both functions exist, check if metadata differs
    if (func.mainFunction && func.currentFunction) {
      const metadataChanged =
        func.mainFunction.name !== func.currentFunction.name ||
        func.mainFunction.updated_at !== func.currentFunction.updated_at ||
        func.mainFunction.version !== func.currentFunction.version

      console.log(`🎯 Function ${func.name} metadata comparison:`, {
        nameChanged: func.mainFunction.name !== func.currentFunction.name,
        updatedAtChanged: func.mainFunction.updated_at !== func.currentFunction.updated_at,
        versionChanged: func.mainFunction.version !== func.currentFunction.version,
        willFetchBody: metadataChanged,
      })

      return metadataChanged
    }

    return false
  }, [func])

  // Only fetch function bodies if metadata indicates potential changes
  const { data: mainFunctionBody, isLoading: isLoadingMainBody } = useEdgeFunctionBodyQuery(
    { projectRef: mainProjectRef, slug: func.slug },
    {
      enabled: !!mainProjectRef && !!func.mainFunction && needsBodyComparison,
    }
  )

  const { data: currentFunctionBody, isLoading: isLoadingCurrentBody } = useEdgeFunctionBodyQuery(
    { projectRef: currentProjectRef, slug: func.slug },
    {
      enabled: !!currentProjectRef && !!func.currentFunction && needsBodyComparison,
    }
  )

  // Generate function content for diff display
  const mainContent = useMemo(() => {
    if (func.status === 'added' || !func.mainFunction) {
      return '// Function does not exist in main branch'
    }

    if (!needsBodyComparison) {
      return `// Function: ${func.name}
// No changes detected in metadata (name, updated_at, version)
// Body comparison skipped for performance`
    }

    if (isLoadingMainBody || (!mainFunctionBody && needsBodyComparison)) {
      return `// Function: ${func.name}
// Loading function body...`
    }

    if (!mainFunctionBody || mainFunctionBody.length === 0) {
      return `// Function: ${func.name}
// No function files found`
    }

    // Combine all files into a single content for display
    return mainFunctionBody
      .map((file) => `// File: ${file.name}\n${file.content}`)
      .join('\n\n// ========================================\n\n')
  }, [func, mainFunctionBody, needsBodyComparison, isLoadingMainBody])

  const currentContent = useMemo(() => {
    if (func.status === 'removed' || !func.currentFunction) {
      return '// Function was removed in current branch'
    }

    if (!needsBodyComparison) {
      return `// Function: ${func.name}
// No changes detected in metadata (name, updated_at, version)
// Body comparison skipped for performance`
    }

    if (isLoadingCurrentBody || (!currentFunctionBody && needsBodyComparison)) {
      return `// Function: ${func.name}
// Loading function body...`
    }

    if (!currentFunctionBody || currentFunctionBody.length === 0) {
      return `// Function: ${func.name}
// No function files found`
    }

    // Combine all files into a single content for display
    return currentFunctionBody
      .map((file) => `// File: ${file.name}\n${file.content}`)
      .join('\n\n// ========================================\n\n')
  }, [func, currentFunctionBody, needsBodyComparison, isLoadingCurrentBody])

  // Determine actual status based on metadata and content comparison
  const actualStatus = useMemo(() => {
    if (func.status === 'added' || func.status === 'removed') {
      return func.status
    }

    if (!needsBodyComparison) {
      return 'unchanged'
    }

    // If we have both bodies and they're different, it's modified
    if (mainFunctionBody && currentFunctionBody && mainContent !== currentContent) {
      return 'modified'
    }

    // If metadata changed but bodies are the same (or still loading), show as potentially modified
    if (needsBodyComparison) {
      return 'modified'
    }

    return 'unchanged'
  }, [
    func.status,
    needsBodyComparison,
    mainFunctionBody,
    currentFunctionBody,
    mainContent,
    currentContent,
  ])

  return (
    <Card>
      <CardHeader className="flex-row items-center py-3 px-4 gap-2 w-full space-y-0">
        {getStatusIcon(actualStatus)}
        <CardTitle className={getStatusColor(actualStatus)}>{func.name}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-64">
          <DiffEditor
            theme="supabase"
            language="typescript"
            height="100%"
            original={mainContent}
            modified={currentContent}
            options={defaultOptions}
          />
        </div>
      </CardContent>
    </Card>
  )
}

// Function to convert table data to SQL, similar to SchemaGraph.tsx
function tableToSQL(table: any): string {
  if (!table || !Array.isArray(table.columns)) {
    return '-- Table definition not available'
  }

  const columns = table.columns || []
  const columnLines = columns.map((c: any) => {
    let line = `  ${c.name} ${c.data_type}`
    if (c.is_identity) {
      line += ' GENERATED ALWAYS AS IDENTITY'
    }
    if (c.is_nullable === false) {
      line += ' NOT NULL'
    }
    if (c.default_value !== null && c.default_value !== undefined) {
      line += ` DEFAULT ${c.default_value}`
    }
    if (c.is_unique) {
      line += ' UNIQUE'
    }
    if (c.check) {
      line += ` CHECK (${c.check})`
    }
    return line
  })

  const constraints: string[] = []

  if (Array.isArray(table.primary_keys) && table.primary_keys.length > 0) {
    const pkCols = table.primary_keys.map((pk: any) => pk.name).join(', ')
    constraints.push(`  CONSTRAINT ${table.name}_pkey PRIMARY KEY (${pkCols})`)
  }

  if (Array.isArray(table.relationships)) {
    table.relationships.forEach((rel: any) => {
      if (rel && rel.source_table_name === table.name) {
        constraints.push(
          `  CONSTRAINT ${rel.constraint_name} FOREIGN KEY (${rel.source_column_name}) REFERENCES ${rel.target_table_schema}.${rel.target_table_name}(${rel.target_column_name})`
        )
      }
    })
  }

  const allLines = [...columnLines, ...constraints]
  return `CREATE TABLE ${table.schema}.${table.name} (\n${allLines.join(',\n')}\n);`
}

MergePage.getLayout = (page) => (
  <DefaultLayout>
    <ProjectLayoutWithAuth>{page}</ProjectLayoutWithAuth>
  </DefaultLayout>
)

export default MergePage
