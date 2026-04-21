import { PermissionAction } from '@supabase/shared-types/out/constants'
import { LOCAL_STORAGE_KEYS, useParams } from 'common'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Check, Lightbulb, Shield, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { PropsWithChildren, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button, Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'ui'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderAside,
  PageHeaderDescription,
  PageHeaderIcon,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'
import {
  PageSection,
  PageSectionContent,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import AlertError from '@/components/ui/AlertError'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import {
  parseDbSchemaString,
  useProjectPostgrestConfigQuery,
} from '@/data/config/project-postgrest-config-query'
import { useProjectLintsQuery } from '@/data/lint/lint-query'
import { useTablePrivilegesQuery } from '@/data/privileges/table-privileges-query'
import { useTableUpdateMutation } from '@/data/tables/table-update-mutation'
import { useTablesQuery } from '@/data/tables/tables-query'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { isApiAccessRole, isApiPrivilegeType } from '@/lib/data-api-types'

const ALLOWED_PATHNAMES = new Set(['/project/[ref]/auth/policies'])
const DEFAULT_EXPOSED_SCHEMA = 'public'

type ProjectSecurityTable = {
  id: number
  name: string
  schema: string
  rlsEnabled: boolean
  dataApiAccessible: boolean
  hasRlsIssue: boolean
}

type ProjectSecurityTableToToggleRLS = Pick<
  ProjectSecurityTable,
  'id' | 'schema' | 'name' | 'rlsEnabled'
>

const getTableKey = ({ schema, name }: { schema: string; name: string }) => `${schema}.${name}`

const getExposedSchemas = (dbSchema: string | null | undefined) => {
  const schemas = dbSchema ? parseDbSchemaString(dbSchema) : []
  return schemas.length > 0 ? schemas : [DEFAULT_EXPOSED_SCHEMA]
}

const formatRlsDescription = (count: number) => {
  const noun = count === 1 ? 'table' : 'tables'

  return `${count} ${noun} has RLS disabled which means anyone can access its data via the Data API.`
}

const StatusCell = ({ enabled, label }: { enabled: boolean; label: string }) => (
  <div className="flex items-center gap-2 text-sm">
    {enabled ? (
      <Check size={14} className="text-success-600" aria-hidden="true" />
    ) : (
      <X size={14} className="text-destructive" aria-hidden="true" />
    )}
    <span>{label}</span>
  </div>
)

const sortTables = (tables: ProjectSecurityTable[]) => {
  return [...tables].sort((a, b) => {
    const aPriority = a.hasRlsIssue ? 0 : a.rlsEnabled ? 2 : 1
    const bPriority = b.hasRlsIssue ? 0 : b.rlsEnabled ? 2 : 1

    if (aPriority !== bPriority) return aPriority - bPriority

    const schemaComparison = a.schema.localeCompare(b.schema)
    if (schemaComparison !== 0) return schemaComparison

    return a.name.localeCompare(b.name)
  })
}

const ProjectNeedsSecuringView = ({
  projectRef,
  connectionString,
  issueCount,
  tables,
  isLoading,
  error,
  onDismiss,
}: {
  projectRef: string
  connectionString?: string | null
  issueCount: number
  tables: ProjectSecurityTable[]
  isLoading: boolean
  error?: { message: string } | null
  onDismiss: () => void
}) => {
  const [selectedTableToToggleRLS, setSelectedTableToToggleRLS] =
    useState<ProjectSecurityTableToToggleRLS>()

  const { can: canToggleRLS } = useAsyncCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_WRITE,
    'tables'
  )

  const { mutate: updateTable, isPending: isUpdatingTable } = useTableUpdateMutation({
    onError: (error) => {
      toast.error(`Failed to toggle RLS: ${error.message}`)
    },
    onSettled: () => {
      setSelectedTableToToggleRLS(undefined)
    },
  })

  const onToggleRLS = () => {
    if (!selectedTableToToggleRLS) return console.error('Table is required')

    updateTable({
      projectRef,
      connectionString,
      id: selectedTableToToggleRLS.id,
      name: selectedTableToToggleRLS.name,
      schema: selectedTableToToggleRLS.schema,
      payload: {
        id: selectedTableToToggleRLS.id,
        rls_enabled: !selectedTableToToggleRLS.rlsEnabled,
      },
    })
  }

  return (
    <>
      <div className="flex flex-1 flex-col overflow-y-auto">
        <PageHeader size="default">
          <PageHeaderMeta>
            <PageHeaderIcon>
              <div className="shrink-0 w-14 h-14 relative bg-destructive-200 border border-destructive-400 rounded-md flex items-center justify-center">
                <Lightbulb size={20} strokeWidth={1.5} className="text-destructive" />
              </div>
            </PageHeaderIcon>
            <PageHeaderSummary>
              <PageHeaderTitle>Your project needs securing</PageHeaderTitle>
              <PageHeaderDescription>{formatRlsDescription(issueCount)}</PageHeaderDescription>
          </PageHeaderSummary>
          <PageHeaderAside>
            <Button asChild type="default" iconRight={<ArrowRight />}>
              <Link href={`/project/${projectRef}`} onClick={onDismiss}>
                Skip to home
              </Link>
            </Button>
          </PageHeaderAside>
          </PageHeaderMeta>
        </PageHeader>

        <PageContainer size="default" className="pb-12">
          <PageSection>
            <PageSectionMeta>
              <PageSectionSummary>
                <PageSectionTitle>Review and fix</PageSectionTitle>
              </PageSectionSummary>
            </PageSectionMeta>
            <PageSectionContent>
              {isLoading ? (
                <GenericSkeletonLoader />
              ) : error ? (
                <AlertError
                  projectRef={projectRef}
                  error={error}
                  subject="Failed to retrieve project tables"
                />
              ) : (
                <Card>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Schema</TableHead>
                        <TableHead>Accessible via Data API</TableHead>
                        <TableHead>RLS</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tables.map((table) => (
                        <TableRow key={getTableKey(table)}>
                          <TableCell className="font-medium">{table.name}</TableCell>
                          <TableCell>{table.schema}</TableCell>
                          <TableCell>
                            <StatusCell
                              enabled={table.dataApiAccessible}
                              label={table.dataApiAccessible ? 'Accessible' : 'Not accessible'}
                            />
                          </TableCell>
                          <TableCell>
                            <StatusCell
                              enabled={table.rlsEnabled}
                              label={table.rlsEnabled ? 'Enabled' : 'Disabled'}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            {!table.rlsEnabled && (
                              <ButtonTooltip
                                type="default"
                                size="tiny"
                                icon={<Shield size={14} />}
                                disabled={!canToggleRLS}
                                onClick={() => setSelectedTableToToggleRLS(table)}
                                data-testid={`${table.name}-toggle-rls`}
                                tooltip={{
                                  content: {
                                    side: 'bottom',
                                    text: !canToggleRLS
                                      ? 'You need additional permissions to toggle RLS'
                                      : undefined,
                                  },
                                }}
                              >
                                Enable RLS
                              </ButtonTooltip>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              )}
            </PageSectionContent>
          </PageSection>
        </PageContainer>
      </div>

      <ConfirmationModal
        visible={selectedTableToToggleRLS !== undefined}
        variant="default"
        title="Enable Row Level Security"
        description={`Are you sure you want to enable Row Level Security (RLS) for the table “${selectedTableToToggleRLS?.name}”?`}
        confirmLabel="Enable RLS"
        confirmLabelLoading="Enabling RLS"
        loading={isUpdatingTable}
        onCancel={() => setSelectedTableToToggleRLS(undefined)}
        onConfirm={onToggleRLS}
      />
    </>
  )
}

export const ProjectNeedsSecuring = ({ children }: PropsWithChildren) => {
  const { ref: projectRef } = useParams()
  const router = useRouter()
  const { data: project } = useSelectedProjectQuery()
  const [securityDismissedAt, setSecurityDismissedAt, { isLoading: isLoadingDismissedAt }] =
    useLocalStorageQuery<string | null>(
      projectRef
        ? LOCAL_STORAGE_KEYS.PROJECT_SECURITY_DISMISSED_AT(projectRef)
        : 'project-security-dismissed-at-unknown',
      null
    )

  const isAllowedRoute = ALLOWED_PATHNAMES.has(router.pathname)

  const { data: lints = [], isPending: isLoadingLints } = useProjectLintsQuery(
    { projectRef },
    { enabled: !isAllowedRoute && !!projectRef }
  )

  const rlsIssueKeys = useMemo(() => {
    return new Set(
      lints
        .filter((lint) => lint.name === 'rls_disabled_in_public' && lint.level === 'ERROR')
        .map((lint) => {
          const schema = typeof lint.metadata?.schema === 'string' ? lint.metadata.schema : null
          const name = typeof lint.metadata?.name === 'string' ? lint.metadata.name : null

          return schema && name ? getTableKey({ schema, name }) : null
        })
        .filter((value): value is string => value !== null)
    )
  }, [lints])

  const hasRlsIssues = rlsIssueKeys.size > 0
  const shouldRenderGate =
    !isAllowedRoute &&
    !!projectRef &&
    !isLoadingDismissedAt &&
    hasRlsIssues &&
    securityDismissedAt === null

  const { data: tables, error: tablesError, isPending: isLoadingTables } = useTablesQuery(
    {
      projectRef,
      connectionString: project?.connectionString,
      includeColumns: false,
    },
    { enabled: shouldRenderGate }
  )

  const {
    data: dbSchema,
    error: postgrestConfigError,
    isPending: isLoadingPostgrestConfig,
  } = useProjectPostgrestConfigQuery(
    { projectRef },
    {
      enabled: shouldRenderGate,
      select: ({ db_schema }) => db_schema,
    }
  )

  const {
    data: tablePrivileges,
    error: tablePrivilegesError,
    isPending: isLoadingTablePrivileges,
  } = useTablePrivilegesQuery(
    { projectRef, connectionString: project?.connectionString },
    { enabled: shouldRenderGate }
  )

  const tableRows = useMemo(() => {
    if (!tables) return []

    const exposedSchemas = getExposedSchemas(dbSchema)
    const dataApiAccessByTable = new Map<string, boolean>()

    for (const entry of tablePrivileges ?? []) {
      const key = getTableKey(entry)
      const hasDataApiAccess = entry.privileges.some(
        (privilege) =>
          isApiAccessRole(privilege.grantee) &&
          isApiPrivilegeType(privilege.privilege_type)
      )

      if (hasDataApiAccess) {
        dataApiAccessByTable.set(key, true)
      }
    }

    return sortTables(
      tables
        .filter((table) => exposedSchemas.includes(table.schema))
        .map((table) => {
          const key = getTableKey(table)

          return {
            id: table.id,
            name: table.name,
            schema: table.schema,
            rlsEnabled: table.rls_enabled,
            dataApiAccessible: dataApiAccessByTable.get(key) === true,
            hasRlsIssue: rlsIssueKeys.has(key),
          }
        })
    )
  }, [dbSchema, rlsIssueKeys, tablePrivileges, tables])

  if (isAllowedRoute || !projectRef || isLoadingLints || !hasRlsIssues) {
    return <>{children}</>
  }

  return (
    <AnimatePresence mode="wait">
      {shouldRenderGate ? (
        <motion.div
          key="project-needs-securing"
          className="flex flex-1 min-h-0 w-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <ProjectNeedsSecuringView
            projectRef={projectRef}
            connectionString={project?.connectionString}
            issueCount={rlsIssueKeys.size}
            tables={tableRows}
            isLoading={isLoadingTables || isLoadingPostgrestConfig || isLoadingTablePrivileges}
            error={tablesError ?? postgrestConfigError ?? tablePrivilegesError}
            onDismiss={() => setSecurityDismissedAt(new Date().toISOString())}
          />
        </motion.div>
      ) : (
        <motion.div
          key="project-needs-securing-children"
          className="flex flex-1 min-h-0 w-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default ProjectNeedsSecuring
