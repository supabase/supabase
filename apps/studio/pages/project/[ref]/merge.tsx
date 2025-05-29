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
import {
  useBranchDatabaseComparison,
  useTableDefinitionComparison,
} from 'hooks/misc/useBranchDatabaseComparison'
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
          connectionString: mainProject.connectionString ? '[REDACTED]' : null,
        }
      : null,
    currentProject: project
      ? {
          ref: project.ref,
          connectionString: project.connectionString ? '[REDACTED]' : null,
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
    mainBranchConnectionString: undefined, // Main project uses default connection (no special header)
    currentBranchConnectionString: project?.connectionString, // Use current branch's connection
  })

  // Filter tables to show only those with changes or potential changes
  const tablesWithChanges = useMemo(() => {
    const filtered = databaseComparison.tables.filter((table) => table.status !== 'unchanged')
    console.log('🎯 Tables With Changes Filter:', {
      totalTables: databaseComparison.tables.length,
      filteredCount: filtered.length,
      allTables: databaseComparison.tables.map((t) => ({
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
        return <Plus size={16} strokeWidth={1.5} className="text-green-500" />
      case 'removed':
        return <Minus size={16} strokeWidth={1.5} className="text-red-500" />
      case 'modified':
        return <Edit size={16} strokeWidth={1.5} className="text-warning" />
      default:
        return <Table size={16} strokeWidth={1.5} className="text-foreground-light" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'added':
        return 'text-green-500'
      case 'removed':
        return 'text-red-500'
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
              Functions <Badge>0</Badge>
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
            <div className="p-6 text-center">
              <p>Function comparison not implemented yet</p>
            </div>
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
  // Get table definitions for comparison
  const { mainDefinition, currentDefinition, isLoading, isModified } = useTableDefinitionComparison(
    mainProjectRef,
    currentProjectRef,
    mainConnectionString,
    currentConnectionString,
    table.mainTableId,
    table.currentTableId
  )

  // Determine actual status based on definitions
  const actualStatus = table.status === 'unchanged' && isModified ? 'modified' : table.status

  // Prepare diff content
  const originalContent =
    table.status === 'added'
      ? '-- Table does not exist in main branch'
      : mainDefinition || '-- Loading...'
  const modifiedContent =
    table.status === 'removed'
      ? '-- Table was removed in current branch'
      : currentDefinition || '-- Loading...'

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-2 w-full space-y-0">
        {getStatusIcon(actualStatus)}
        <CardTitle className={getStatusColor(actualStatus)}>
          {table.schemaName}.{table.tableName}
        </CardTitle>
        <Badge
          variant={
            actualStatus === 'added'
              ? 'default'
              : actualStatus === 'removed'
                ? 'destructive'
                : 'secondary'
          }
        >
          {actualStatus}
        </Badge>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-96">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <p>Loading table definition...</p>
            </div>
          ) : (
            <DiffEditor
              theme="supabase"
              language="sql"
              original={originalContent}
              modified={modifiedContent}
              options={defaultOptions}
            />
          )}
        </div>
      </CardContent>
    </Card>
  )
}

MergePage.getLayout = (page) => (
  <DefaultLayout>
    <ProjectLayoutWithAuth>{page}</ProjectLayoutWithAuth>
  </DefaultLayout>
)

export default MergePage
