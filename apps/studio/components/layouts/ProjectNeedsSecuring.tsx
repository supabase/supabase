import { LOCAL_STORAGE_KEYS, useFlag, useParams } from 'common'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Check, ExternalLink, Lightbulb, Lock, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { PropsWithChildren, useMemo } from 'react'
import {
  Button,
  Button_Shadcn_,
  Card,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui'
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
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { SIDEBAR_KEYS } from '@/components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { AiAssistantDropdown } from '@/components/ui/AiAssistantDropdown'
import AlertError from '@/components/ui/AlertError'
import {
  parseDbSchemaString,
  useProjectPostgrestConfigQuery,
} from '@/data/config/project-postgrest-config-query'
import { useProjectLintsQuery } from '@/data/lint/lint-query'
import { useTablePrivilegesQuery } from '@/data/privileges/table-privileges-query'
import { useTablesQuery } from '@/data/tables/tables-query'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { isApiAccessRole, isApiPrivilegeType } from '@/lib/data-api-types'
import { useTrack } from '@/lib/telemetry/track'
import { useAiAssistantStateSnapshot } from '@/state/ai-assistant-state'
import { useSidebarManagerSnapshot } from '@/state/sidebar-manager-state'

const PROJECT_SECURITY_FEATURE_FLAG = 'projectNeedsSecuring'
const PROJECT_HOME_PATHNAME = '/project/[ref]'
const DEFAULT_EXPOSED_SCHEMA = 'public'

type ProjectSecurityActionType = 'ask_assistant' | 'copy_prompt' | 'skip_to_home' | 'view_policies'

type ProjectSecurityActionDetails = {
  schema?: string
  tableName?: string
}

type ProjectSecurityTable = {
  id: number
  name: string
  schema: string
  rlsEnabled: boolean
  dataApiAccessible: boolean
  hasRlsIssue: boolean
}

const getTableKey = ({ schema, name }: { schema: string; name: string }) => `${schema}.${name}`

const getExposedSchemas = (dbSchema: string | null | undefined) => {
  const schemas = dbSchema ? parseDbSchemaString(dbSchema) : []
  return schemas.length > 0 ? schemas : [DEFAULT_EXPOSED_SCHEMA]
}

const formatRlsDescription = (count: number) => {
  const noun = count === 1 ? 'table' : 'tables'

  return `${count} ${noun} has RLS disabled which means anyone can access its data via the Data API.`
}

const buildSecurityPromptMarkdown = (issueCount: number, tables: ProjectSecurityTable[]) => {
  const noun = issueCount === 1 ? 'table' : 'tables'
  const header = [
    '## Project security review',
    '',
    `${issueCount} ${noun} has RLS disabled which means anyone can access its data via the Data API.`,
    '',
    '### Tables',
    '',
    '| Table | Schema | Accessible via Data API | RLS |',
    '| --- | --- | --- | --- |',
  ]

  const rows = tables.map(
    (table) =>
      `| ${table.name} | ${table.schema} | ${table.dataApiAccessible ? 'Yes' : 'No'} | ${table.rlsEnabled ? 'Enabled' : 'Disabled'} |`
  )

  const footer = [
    '',
    '### Next step',
    '',
    'Help me enable RLS on these tables and suggest the minimum policies I should create.',
  ]

  return [...header, ...rows, ...footer].join('\n')
}

const StatusCell = ({ enabled, label }: { enabled: boolean; label: string }) => (
  <div className="flex items-center gap-2 text-sm">
    {enabled ? (
      <Check size={14} className="text-brand" aria-hidden="true" />
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
  issueCount,
  tables,
  isLoading,
  error,
  onDismiss,
  onTrackAction,
}: {
  projectRef: string
  issueCount: number
  tables: ProjectSecurityTable[]
  isLoading: boolean
  error?: { message: string } | null
  onDismiss: () => void
  onTrackAction: (type: ProjectSecurityActionType, details?: ProjectSecurityActionDetails) => void
}) => {
  const aiSnap = useAiAssistantStateSnapshot()
  const { openSidebar } = useSidebarManagerSnapshot()

  const promptMarkdown = useMemo(
    () => buildSecurityPromptMarkdown(issueCount, tables),
    [issueCount, tables]
  )

  const handleOpenAssistant = () => {
    onTrackAction('ask_assistant')
    openSidebar(SIDEBAR_KEYS.AI_ASSISTANT)
    aiSnap.newChat({
      name: 'Review project security',
      initialInput: promptMarkdown,
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
              <AiAssistantDropdown
                label="Ask Assistant"
                size="tiny"
                buildPrompt={() => promptMarkdown}
                onOpenAssistant={handleOpenAssistant}
                onCopyPrompt={() => onTrackAction('copy_prompt')}
                copyLabel="Copy Markdown"
                disabled={isLoading}
              />
              <Button asChild type="default" iconRight={<ArrowRight />}>
                <Link
                  href={`/project/${projectRef}`}
                  onClick={() => {
                    onTrackAction('skip_to_home')
                    onDismiss()
                  }}
                >
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
                        <TableHead>
                          <div className="flex items-center gap-1.5">
                            <span>Accessible via Data API</span>
                            <Button_Shadcn_ asChild variant="ghost" size="icon" className="h-6 w-6">
                              <Link
                                href={`/project/${projectRef}/integrations/data_api/settings`}
                                target="_blank"
                                rel="noreferrer"
                                aria-label="Open Data API settings"
                              >
                                <ExternalLink size={14} aria-hidden="true" />
                              </Link>
                            </Button_Shadcn_>
                          </div>
                        </TableHead>
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
                              <Button asChild type="default" size="tiny" icon={<Lock size={14} />}>
                                <Link
                                  href={`/project/${projectRef}/auth/policies?schema=${table.schema}&search=${table.name}`}
                                  onClick={() =>
                                    onTrackAction('view_policies', {
                                      schema: table.schema,
                                      tableName: table.name,
                                    })
                                  }
                                >
                                  View policies
                                </Link>
                              </Button>
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
    </>
  )
}

const ProjectNeedsSecuringGate = ({ children }: PropsWithChildren) => {
  const { ref: projectRef } = useParams()
  const router = useRouter()
  const track = useTrack()
  const { data: project } = useSelectedProjectQuery()
  const [securityDismissedAt, setSecurityDismissedAt, { isLoading: isLoadingDismissedAt }] =
    useLocalStorageQuery<string | null>(
      projectRef
        ? LOCAL_STORAGE_KEYS.PROJECT_SECURITY_DISMISSED_AT(projectRef)
        : 'project-security-dismissed-at-unknown',
      null
    )

  const isProjectHomeRoute = router.pathname === PROJECT_HOME_PATHNAME

  const { data: lints = [], isPending: isLoadingLints } = useProjectLintsQuery(
    { projectRef },
    { enabled: isProjectHomeRoute && !!projectRef }
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
    isProjectHomeRoute &&
    !!projectRef &&
    !isLoadingDismissedAt &&
    hasRlsIssues &&
    securityDismissedAt === null

  const {
    data: tables,
    error: tablesError,
    isPending: isLoadingTables,
  } = useTablesQuery(
    {
      projectRef,
      connectionString: project?.connectionString,
      includeColumns: false,
    },
    { enabled: shouldRenderGate }
  )

  const handleTrackAction = (
    type: ProjectSecurityActionType,
    details?: ProjectSecurityActionDetails
  ) => {
    track('project_security_cta_clicked', {
      type,
      ...details,
    })
  }

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
          isApiAccessRole(privilege.grantee) && isApiPrivilegeType(privilege.privilege_type)
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

  if (!isProjectHomeRoute || !projectRef || isLoadingLints || !hasRlsIssues) {
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
            issueCount={rlsIssueKeys.size}
            tables={tableRows}
            isLoading={isLoadingTables || isLoadingPostgrestConfig || isLoadingTablePrivileges}
            error={tablesError ?? postgrestConfigError ?? tablePrivilegesError}
            onDismiss={() => setSecurityDismissedAt(new Date().toISOString())}
            onTrackAction={handleTrackAction}
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

export const ProjectNeedsSecuring = ({ children }: PropsWithChildren) => {
  const isEnabled = true //useFlag(PROJECT_SECURITY_FEATURE_FLAG)

  if (!isEnabled) {
    return <>{children}</>
  }

  return <ProjectNeedsSecuringGate>{children}</ProjectNeedsSecuringGate>
}

export default ProjectNeedsSecuring
