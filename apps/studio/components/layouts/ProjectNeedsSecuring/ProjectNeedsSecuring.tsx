import { LOCAL_STORAGE_KEYS, useFlag, useParams } from 'common'
import { AnimatePresence, motion } from 'framer-motion'
import { useRouter } from 'next/router'
import { PropsWithChildren, useMemo } from 'react'

import type {
  ProjectSecurityActionDetails,
  ProjectSecurityActionType,
} from './ProjectNeedsSecuring.types'
import { getExposedSchemas, getTableKey, sortTables } from './ProjectNeedsSecuring.utils'
import { ProjectNeedsSecuringView } from './ProjectNeedsSecuringView'
import { useProjectPostgrestConfigQuery } from '@/data/config/project-postgrest-config-query'
import { useProjectLintsQuery } from '@/data/lint/lint-query'
import { useTablePrivilegesQuery } from '@/data/privileges/table-privileges-query'
import { useTablesQuery } from '@/data/tables/tables-query'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { isApiAccessRole, isApiPrivilegeType } from '@/lib/data-api-types'
import { useTrack } from '@/lib/telemetry/track'

const PROJECT_SECURITY_FEATURE_FLAG = 'projectNeedsSecuring'
const PROJECT_HOME_PATHNAME = '/project/[ref]'

const ProjectNeedsSecuringGate = ({ children }: PropsWithChildren) => {
  const router = useRouter()
  const track = useTrack()
  const { ref: projectRef } = useParams()
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
        .filter((table) => !table.rls_enabled && rlsIssueKeys.has(getTableKey(table)))
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
  const isEnabled = useFlag(PROJECT_SECURITY_FEATURE_FLAG)

  if (!isEnabled) return <>{children}</>
  return <ProjectNeedsSecuringGate>{children}</ProjectNeedsSecuringGate>
}
