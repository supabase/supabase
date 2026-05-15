import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { Realtime } from 'icons'
import { BookOpenText, Lightbulb, Lock, MoreVertical, PlusCircle, Unlock } from 'lucide-react'
import Link from 'next/link'
import { parseAsBoolean, useQueryState } from 'nuqs'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

import { EnableIndexAdvisorDialog } from '../QueryPerformance/IndexAdvisor/EnableIndexAdvisorButton'
import { RoleImpersonationPopover } from '../RoleImpersonationSelector/RoleImpersonationPopover'
import { InsertButton } from './InsertButton'
import { RealtimeToggleDialog } from './RealtimeToggleDialog'
import { SecurityDefinerViewPopover } from './SecurityDefinerViewPopover'
import { ViewEntityAutofixSecurityModal } from './ViewEntityAutofixSecurityModal'
import { RefreshButton } from '@/components/grid/components/header/RefreshButton'
import { useTableIndexAdvisor } from '@/components/grid/context/TableIndexAdvisorContext'
import {
  getEntityLintDetails,
  getTablePoliciesUrl,
} from '@/components/interfaces/TableGridEditor/TableEntity.utils'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { useDatabasePoliciesQuery } from '@/data/database-policies/database-policies-query'
import { useIsTableRealtimeEnabled } from '@/data/database-publications/database-publications-query'
import { useProjectLintsQuery } from '@/data/lint/lint-query'
import {
  Entity,
  isTableLike,
  isForeignTable as isTableLikeForeignTable,
  isMaterializedView as isTableLikeMaterializedView,
  isView as isTableLikeView,
} from '@/data/table-editor/table-editor-types'
import { useTableUpdateMutation } from '@/data/tables/table-update-mutation'
import { useSendEventMutation } from '@/data/telemetry/send-event-mutation'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useIsProtectedSchema } from '@/hooks/useProtectedSchemas'
import { DOCS_URL } from '@/lib/constants'
import { useTrack } from '@/lib/telemetry/track'
import { useAppStateSnapshot } from '@/state/app-state'
import { useTableEditorTableStateSnapshot } from '@/state/table-editor-table'

export interface GridHeaderActionsProps {
  table: Entity
  isRefetching: boolean
}
export const GridHeaderActions = ({ table, isRefetching }: GridHeaderActionsProps) => {
  const track = useTrack()
  const { ref } = useParams()
  const appSnap = useAppStateSnapshot()
  const snap = useTableEditorTableStateSnapshot()
  const { data: project } = useSelectedProjectQuery()
  const { data: org } = useSelectedOrganizationQuery()
  const { mutate: sendEvent } = useSendEventMutation()

  const [rlsConfirmModalOpen, setRlsConfirmModalOpen] = useState(false)
  const [realtimeDialogOpen, setRealtimeDialogOpen] = useState(false)
  const [indexAdvisorDialogOpen, setIndexAdvisorDialogOpen] = useState(false)
  const [isAutofixViewSecurityModalOpen, setIsAutofixViewSecurityModalOpen] = useState(false)

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

  const isRealtimeEnabled = useIsTableRealtimeEnabled({ id: table.id })

  const { mutate: updateTable, isPending: isUpdatingTable } = useTableUpdateMutation({
    onError: (error) => {
      toast.error(`Failed to toggle RLS: ${error.message}`)
    },
    onSettled: () => {
      closeConfirmModal()
    },
  })

  const showHeaderActions = snap.selectedRows.size === 0

  const projectRef = project?.ref
  const { data } = useDatabasePoliciesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const policies = (data ?? []).filter(
    (policy) => policy.schema === table.schema && policy.table === table.name
  )

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

  const closeConfirmModal = () => {
    setRlsConfirmModalOpen(false)
  }

  const onViewAPIDocs = () => {
    appSnap.setActiveDocsSection(['entities', table.name])
    appSnap.setShowProjectApiDocs(true)

    sendEvent({
      action: 'api_docs_opened',
      properties: {
        source: 'table_editor',
      },
      groups: {
        project: ref ?? 'Unknown',
        organization: org?.slug ?? 'Unknown',
      },
    })
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
                <div className="border border-strong rounded-sm bg-overlay-hover px-3 py-1 text-xs">
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
                    <Link passHref href={getTablePoliciesUrl(projectRef, table.schema, table.name)}>
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
                    <Link passHref href={getTablePoliciesUrl(projectRef, table.schema, table.name)}>
                      RLS {policies.length > 1 ? 'policies' : 'policy'}
                    </Link>
                  </Button>
                )}
              </>
            ) : tableHasLints ? (
              <Popover modal={false} open={showWarning} onOpenChange={setShowWarning}>
                <PopoverTrigger asChild>
                  <Button type="danger" icon={<Lock strokeWidth={1.5} />}>
                    RLS disabled
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 text-sm" align="end">
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
                </PopoverContent>
              </Popover>
            ) : null
          ) : null}

          {isView && viewHasLints && (
            <SecurityDefinerViewPopover
              lint={matchingViewLint}
              onAutofix={() => {
                setIsAutofixViewSecurityModalOpen(true)
              }}
            />
          )}

          {isMaterializedView && materializedViewHasLints && (
            <SecurityDefinerViewPopover lint={matchingMaterializedViewLint} />
          )}

          {isForeignTable && table.schema === 'public' && (
            <Popover modal={false} open={showWarning} onOpenChange={setShowWarning}>
              <PopoverTrigger asChild>
                <Button type="warning" icon={<Unlock strokeWidth={1.5} />}>
                  Unprotected Data API access
                </Button>
              </PopoverTrigger>
              <PopoverContent className="min-w-[395px] text-sm" align="end">
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
              </PopoverContent>
            </Popover>
          )}

          <RoleImpersonationPopover header="View data as a role" align="center" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="default" icon={<MoreVertical />} className="h-7 w-7" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48">
              {isTable && realtimeEnabled && (
                <DropdownMenuItem className="gap-x-2" onClick={() => setRealtimeDialogOpen(true)}>
                  <Realtime size={14} className={isRealtimeEnabled ? 'text-brand' : ''} />
                  <span>{isRealtimeEnabled ? 'Disable' : 'Enable'} Realtime</span>
                </DropdownMenuItem>
              )}
              {doesHaveAutoGeneratedAPIDocs && (
                <DropdownMenuItem className="gap-x-2" onClick={() => onViewAPIDocs()}>
                  <BookOpenText size={14} />
                  <span>View API docs</span>
                </DropdownMenuItem>
              )}
              {isTable && isIndexAdvisorAvailable && !isIndexAdvisorEnabled && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="gap-x-2"
                    onClick={() => setIndexAdvisorDialogOpen(true)}
                  >
                    <Lightbulb size={14} />
                    <span>Enable Index Advisor</span>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <RefreshButton tableId={table.id} isRefetching={isRefetching} />

          {showHeaderActions && <InsertButton />}
        </div>
      )}

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

      <RealtimeToggleDialog
        table={table}
        open={realtimeDialogOpen}
        setOpen={setRealtimeDialogOpen}
      />

      <EnableIndexAdvisorDialog open={indexAdvisorDialogOpen} setOpen={setIndexAdvisorDialogOpen} />
    </div>
  )
}
