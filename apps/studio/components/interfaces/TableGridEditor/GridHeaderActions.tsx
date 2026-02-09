import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Lightbulb, Lock, MousePointer2, PlusCircle, Unlock } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { RefreshButton } from 'components/grid/components/header/RefreshButton'
import { useTableIndexAdvisor } from 'components/grid/context/TableIndexAdvisorContext'
import { EnableIndexAdvisorButton } from 'components/interfaces/QueryPerformance/IndexAdvisor/EnableIndexAdvisorButton'
import { getEntityLintDetails } from 'components/interfaces/TableGridEditor/TableEntity.utils'
import { APIDocsButton } from 'components/ui/APIDocsButton'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useDatabasePoliciesQuery } from 'data/database-policies/database-policies-query'
import { useDatabasePublicationsQuery } from 'data/database-publications/database-publications-query'
import { useDatabasePublicationUpdateMutation } from 'data/database-publications/database-publications-update-mutation'
import { useProjectLintsQuery } from 'data/lint/lint-query'
import {
  Entity,
  isTableLike,
  isForeignTable as isTableLikeForeignTable,
  isMaterializedView as isTableLikeMaterializedView,
  isView as isTableLikeView,
} from 'data/table-editor/table-editor-types'
import { useTableUpdateMutation } from 'data/tables/table-update-mutation'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useIsProtectedSchema } from 'hooks/useProtectedSchemas'
import { DOCS_URL } from 'lib/constants'
import { useTrack } from 'lib/telemetry/track'
import { parseAsBoolean, useQueryState } from 'nuqs'
import { useTableEditorTableStateSnapshot } from 'state/table-editor-table'
import {
  Button,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  cn,
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { RoleImpersonationPopover } from '../RoleImpersonationSelector/RoleImpersonationPopover'
import ViewEntityAutofixSecurityModal from './ViewEntityAutofixSecurityModal'

export interface GridHeaderActionsProps {
  table: Entity
  isRefetching: boolean
}

export const GridHeaderActions = ({ table, isRefetching }: GridHeaderActionsProps) => {
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const track = useTrack()

  const [showWarning, setShowWarning] = useQueryState(
    'showWarning',
    parseAsBoolean.withDefault(false)
  )

  // need project lints to get security status for views
  const { data: lints = [] } = useProjectLintsQuery({ projectRef: project?.ref })

  // Use table-specific index advisor context
  const { isAvailable: isIndexAdvisorAvailable, isEnabled: isIndexAdvisorEnabled } =
    useTableIndexAdvisor()

  const isTable = isTableLike(table)
  const isForeignTable = isTableLikeForeignTable(table)
  const isView = isTableLikeView(table)
  const isMaterializedView = isTableLikeMaterializedView(table)

  const { realtimeAll: realtimeEnabled } = useIsFeatureEnabled(['realtime:all'])
  const { isSchemaLocked } = useIsProtectedSchema({ schema: table.schema })

  const { mutate: updateTable, isPending: isUpdatingTable } = useTableUpdateMutation({
    onError: (error) => {
      toast.error(`Failed to toggle RLS: ${error.message}`)
    },
    onSettled: () => {
      closeConfirmModal()
    },
  })

  const [showEnableRealtime, setShowEnableRealtime] = useState(false)
  const [rlsConfirmModalOpen, setRlsConfirmModalOpen] = useState(false)
  const [isAutofixViewSecurityModalOpen, setIsAutofixViewSecurityModalOpen] = useState(false)

  const snap = useTableEditorTableStateSnapshot()
  const showHeaderActions = snap.selectedRows.size === 0

  const projectRef = project?.ref
  const { data } = useDatabasePoliciesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const policies = (data ?? []).filter(
    (policy) => policy.schema === table.schema && policy.table === table.name
  )

  const { data: publications } = useDatabasePublicationsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const realtimePublication = (publications ?? []).find(
    (publication) => publication.name === 'supabase_realtime'
  )
  const realtimeEnabledTables = realtimePublication?.tables ?? []
  const isRealtimeEnabled = realtimeEnabledTables.some((t) => t.id === table?.id)

  const { mutate: updatePublications, isPending: isTogglingRealtime } =
    useDatabasePublicationUpdateMutation({
      onSuccess: () => {
        setShowEnableRealtime(false)

        track(isRealtimeEnabled ? 'table_realtime_disabled' : 'table_realtime_enabled', {
          method: 'ui',
          schema_name: table.schema,
          table_name: table.name,
        })
      },
      onError: (error) => {
        toast.error(`Failed to toggle realtime for ${table.name}: ${error.message}`)
      },
    })

  const { can: canSqlWriteTables, isLoading: isLoadingPermissions } = useAsyncCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_WRITE,
    'tables'
  )
  const { can: canSqlWriteColumns } = useAsyncCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_WRITE,
    'columns'
  )
  const isReadOnly = !isLoadingPermissions && !canSqlWriteTables && !canSqlWriteColumns
  // This will change when we allow autogenerated API docs for schemas other than `public`
  const doesHaveAutoGeneratedAPIDocs = table.schema === 'public'

  const { hasLint: tableHasLints } = getEntityLintDetails(
    table.name,
    'rls_disabled_in_public',
    ['ERROR'],
    lints,
    table.schema
  )

  const { hasLint: viewHasLints, matchingLint: matchingViewLint } = getEntityLintDetails(
    table.name,
    'security_definer_view',
    ['ERROR', 'WARN'],
    lints,
    table.schema
  )

  const { hasLint: materializedViewHasLints, matchingLint: matchingMaterializedViewLint } =
    getEntityLintDetails(
      table.name,
      'materialized_view_in_api',
      ['ERROR', 'WARN'],
      lints,
      table.schema
    )

  const toggleRealtime = async () => {
    if (!project || !realtimePublication) return

    const exists = realtimeEnabledTables.some((x) => x.id === table.id)
    const tables = !exists
      ? [`${table.schema}.${table.name}`].concat(
          realtimeEnabledTables.map((t) => `${t.schema}.${t.name}`)
        )
      : realtimeEnabledTables.filter((x) => x.id !== table.id).map((x) => `${x.schema}.${x.name}`)

    track('realtime_toggle_table_clicked', {
      newState: exists ? 'disabled' : 'enabled',
      origin: 'tableGridHeader',
    })

    updatePublications({
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      id: realtimePublication.id,
      tables,
    })
  }

  const closeConfirmModal = () => {
    setRlsConfirmModalOpen(false)
  }
  const onToggleRLS = async () => {
    const payload = {
      id: table.id,
      rls_enabled: !(isTable && table.rls_enabled),
    }

    updateTable({
      projectRef: project?.ref!,
      connectionString: project?.connectionString,
      id: table.id,
      name: table.name,
      schema: table.schema,
      payload: payload,
    })

    track('table_rls_enabled', {
      method: 'table_editor',
      schema_name: table.schema,
      table_name: table.name,
    })
  }

  return (
    <div className="sb-grid-header__inner">
      {showHeaderActions && (
        <div className="flex items-center gap-x-2">
          {isReadOnly && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="border border-strong rounded bg-overlay-hover px-3 py-1 text-xs">
                  Viewing as read-only
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                You need additional permissions to manage your project's data
              </TooltipContent>
            </Tooltip>
          )}

          {isTable && !isSchemaLocked ? (
            table.rls_enabled ? (
              <>
                {policies.length < 1 && !isSchemaLocked ? (
                  <ButtonTooltip
                    asChild
                    type="default"
                    className="group"
                    icon={<PlusCircle strokeWidth={1.5} className="text-foreground-muted" />}
                    tooltip={{
                      content: {
                        side: 'bottom',
                        className: 'w-[280px]',
                        text: 'RLS is enabled for this table, but no policies are set. Select queries may return 0 results.',
                      },
                    }}
                  >
                    <Link
                      passHref
                      href={`/project/${projectRef}/auth/policies?search=${table.name}&schema=${table.schema}`}
                    >
                      Add RLS policy
                    </Link>
                  </ButtonTooltip>
                ) : (
                  <Button
                    asChild
                    type={policies.length < 1 && !isSchemaLocked ? 'warning' : 'default'}
                    className="group"
                    icon={
                      isSchemaLocked || policies.length > 0 ? (
                        <div
                          className={cn(
                            'flex items-center justify-center rounded-full bg-border-stronger h-[16px]',
                            policies.length > 9 ? ' px-1' : 'w-[16px]',
                            ''
                          )}
                        >
                          <span className="text-[11px] text-foreground font-mono text-center">
                            {policies.length}
                          </span>
                        </div>
                      ) : (
                        <PlusCircle strokeWidth={1.5} />
                      )
                    }
                  >
                    <Link
                      passHref
                      href={`/project/${projectRef}/auth/policies?search=${table.name}&schema=${table.schema}`}
                    >
                      RLS {policies.length > 1 ? 'policies' : 'policy'}
                    </Link>
                  </Button>
                )}
              </>
            ) : tableHasLints ? (
              <Popover_Shadcn_ modal={false} open={showWarning} onOpenChange={setShowWarning}>
                <PopoverTrigger_Shadcn_ asChild>
                  <Button type="danger" icon={<Lock strokeWidth={1.5} />}>
                    RLS disabled
                  </Button>
                </PopoverTrigger_Shadcn_>
                <PopoverContent_Shadcn_ className="w-80 text-sm" align="end">
                  <h4 className="flex items-center gap-2">
                    <Lock size={16} /> Row Level Security (RLS)
                  </h4>
                  <div className="grid gap-2 mt-4 text-foreground-light text-xs">
                    <p>
                      You can restrict and control who can read, write and update data in this table
                      using Row Level Security.
                    </p>
                    <p>
                      With RLS enabled, anonymous users will not be able to read/write data in the
                      table.
                    </p>
                    {!isSchemaLocked && (
                      <Button
                        type="default"
                        className="mt-2 w-min"
                        onClick={() => setRlsConfirmModalOpen(!rlsConfirmModalOpen)}
                      >
                        Enable RLS for this table
                      </Button>
                    )}
                  </div>
                </PopoverContent_Shadcn_>
              </Popover_Shadcn_>
            ) : null
          ) : null}

          {isTable && isIndexAdvisorAvailable && !isIndexAdvisorEnabled && (
            <Popover_Shadcn_ modal={false}>
              <PopoverTrigger_Shadcn_ asChild>
                <Button type="default" icon={<Lightbulb strokeWidth={1.5} />}>
                  Index Advisor
                </Button>
              </PopoverTrigger_Shadcn_>
              <PopoverContent_Shadcn_ className="w-80 text-sm" align="end">
                <h4 className="flex items-center gap-2">
                  <Lightbulb size={16} /> Index Advisor
                </h4>
                <div className="grid gap-2 mt-4 text-foreground-light text-xs">
                  <p>
                    Index Advisor recommends indexes to improve query performance on this table.
                  </p>
                  <p>
                    Enable Index Advisor to get recommendations based on your actual query patterns.
                  </p>
                  <div className="mt-2">
                    <EnableIndexAdvisorButton />
                  </div>
                </div>
              </PopoverContent_Shadcn_>
            </Popover_Shadcn_>
          )}

          {realtimeEnabled && (
            <ButtonTooltip
              type="default"
              size="tiny"
              icon={
                <MousePointer2
                  strokeWidth={1.5}
                  className={isRealtimeEnabled ? 'text-brand' : 'text-foreground-muted'}
                />
              }
              onClick={() => setShowEnableRealtime(true)}
              className={cn(isRealtimeEnabled && 'w-7 h-7 p-0 text-brand hover:text-brand-hover')}
              tooltip={{
                content: {
                  side: 'bottom',
                  text: isRealtimeEnabled
                    ? 'Click to disable realtime for this table'
                    : 'Click to enable realtime for this table',
                },
              }}
            >
              {!isRealtimeEnabled && 'Enable Realtime'}
            </ButtonTooltip>
          )}

          {isView && viewHasLints && (
            <Popover_Shadcn_ modal={false} open={showWarning} onOpenChange={setShowWarning}>
              <PopoverTrigger_Shadcn_ asChild>
                <Button type="warning" icon={<Unlock strokeWidth={1.5} />}>
                  Security Definer view
                </Button>
              </PopoverTrigger_Shadcn_>
              <PopoverContent_Shadcn_ className="min-w-[395px] text-sm" align="end">
                <h3 className="flex items-center gap-2">
                  <Unlock size={16} /> Secure your View
                </h3>
                <div className="grid gap-2 mt-4 text-foreground-light text-sm">
                  <p>
                    This view is defined with the Security Definer property, giving it permissions
                    of the view's creator (Postgres), rather than the permissions of the querying
                    user.
                  </p>

                  <p>
                    Since this view is in the public schema, it is accessible via your project's
                    APIs.
                  </p>

                  <div className="mt-2 flex items-center gap-2">
                    <Button
                      type="secondary"
                      onClick={() => {
                        setIsAutofixViewSecurityModalOpen(true)
                      }}
                    >
                      Autofix
                    </Button>
                    <Button type="default" asChild>
                      <Link
                        target="_blank"
                        href={`/project/${ref}/advisors/security?preset=${matchingViewLint?.level}&id=${matchingViewLint?.cache_key}`}
                      >
                        Learn more
                      </Link>
                    </Button>
                  </div>
                </div>
              </PopoverContent_Shadcn_>
            </Popover_Shadcn_>
          )}

          {isMaterializedView && materializedViewHasLints && (
            <Popover_Shadcn_ modal={false} open={showWarning} onOpenChange={setShowWarning}>
              <PopoverTrigger_Shadcn_ asChild>
                <Button type="warning" icon={<Unlock strokeWidth={1.5} />}>
                  Security Definer view
                </Button>
              </PopoverTrigger_Shadcn_>
              <PopoverContent_Shadcn_ className="min-w-[395px] text-sm" align="end">
                <h3 className="flex items-center gap-2">
                  <Unlock size={16} /> Secure your View
                </h3>
                <div className="grid gap-2 mt-4 text-foreground-light text-sm">
                  <p>
                    This view is defined with the Security Definer property, giving it permissions
                    of the view's creator (Postgres), rather than the permissions of the querying
                    user.
                  </p>

                  <p>
                    Since this view is in the public schema, it is accessible via your project's
                    APIs.
                  </p>

                  <div className="mt-2">
                    <Button type="default" asChild>
                      <Link
                        target="_blank"
                        href={`/project/${ref}/advisors/security?preset=${matchingMaterializedViewLint?.level}&id=${matchingMaterializedViewLint?.cache_key}`}
                      >
                        Learn more
                      </Link>
                    </Button>
                  </div>
                </div>
              </PopoverContent_Shadcn_>
            </Popover_Shadcn_>
          )}

          {isForeignTable && table.schema === 'public' && (
            <Popover_Shadcn_ modal={false} open={showWarning} onOpenChange={setShowWarning}>
              <PopoverTrigger_Shadcn_ asChild>
                <Button type="warning" icon={<Unlock strokeWidth={1.5} />}>
                  Unprotected Data API access
                </Button>
              </PopoverTrigger_Shadcn_>
              <PopoverContent_Shadcn_ className="min-w-[395px] text-sm" align="end">
                <h3 className="flex items-center gap-2">
                  <Unlock size={16} /> Secure Foreign table
                </h3>
                <div className="grid gap-2 mt-4 text-foreground-light text-sm">
                  <p>
                    Foreign tables do not enforce RLS, which may allow unrestricted access. To
                    secure them, either move foreign tables to a private schema not exposed by
                    PostgREST, or <a href="">disable PostgREST access</a> entirely.
                  </p>

                  <div className="mt-2">
                    <Button type="default" asChild>
                      <Link
                        target="_blank"
                        href={`${DOCS_URL}/guides/database/extensions/wrappers/overview#security`}
                      >
                        Learn more
                      </Link>
                    </Button>
                  </div>
                </div>
              </PopoverContent_Shadcn_>
            </Popover_Shadcn_>
          )}

          <RoleImpersonationPopover serviceRoleLabel="postgres" />

          {doesHaveAutoGeneratedAPIDocs && (
            <APIDocsButton section={['entities', table.name]} source="table_editor" />
          )}

          <RefreshButton tableId={table.id} isRefetching={isRefetching} />
        </div>
      )}
      <ConfirmationModal
        visible={showEnableRealtime}
        loading={isTogglingRealtime}
        title={`${isRealtimeEnabled ? 'Disable' : 'Enable'} realtime for ${table.name}`}
        confirmLabel={`${isRealtimeEnabled ? 'Disable' : 'Enable'} realtime`}
        confirmLabelLoading={`${isRealtimeEnabled ? 'Disabling' : 'Enabling'} realtime`}
        onCancel={() => setShowEnableRealtime(false)}
        onConfirm={() => toggleRealtime()}
      >
        <div className="space-y-2">
          <p className="text-sm">
            Once realtime has been {isRealtimeEnabled ? 'disabled' : 'enabled'}, the table will{' '}
            {isRealtimeEnabled ? 'no longer ' : ''}broadcast any changes to authorized subscribers.
          </p>
          {!isRealtimeEnabled && (
            <p className="text-sm">
              You may also select which events to broadcast to subscribers on the{' '}
              <Link href={`/project/${ref}/database/publications`} className="text-brand">
                database publications
              </Link>{' '}
              settings.
            </p>
          )}
        </div>
      </ConfirmationModal>

      <ViewEntityAutofixSecurityModal
        table={table}
        isAutofixViewSecurityModalOpen={isAutofixViewSecurityModalOpen}
        setIsAutofixViewSecurityModalOpen={setIsAutofixViewSecurityModalOpen}
      />

      {isTable && (
        <ConfirmationModal
          visible={rlsConfirmModalOpen}
          variant={table.rls_enabled ? 'destructive' : 'default'}
          title={`${table.rls_enabled ? 'Disable' : 'Enable'} Row Level Security`}
          description={`Are you sure you want to ${
            table.rls_enabled ? 'disable' : 'enable'
          } Row Level Security for this table?`}
          confirmLabel={`${table.rls_enabled ? 'Disable' : 'Enable'} RLS`}
          confirmLabelLoading={`${table.rls_enabled ? 'Disabling' : 'Enabling'} RLS`}
          loading={isUpdatingTable}
          onCancel={closeConfirmModal}
          onConfirm={onToggleRLS}
        />
      )}
    </div>
  )
}
