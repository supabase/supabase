import * as Tooltip from '@radix-ui/react-tooltip'
import type { PostgresPolicy, PostgresTable } from '@supabase/postgres-meta'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import Link from 'next/link'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useCheckPermissions, useStore } from 'hooks'
import { Button, IconAlertCircle, IconCode, IconLock } from 'ui'

export interface GridHeaderActionsProps {
  table: PostgresTable
  apiPreviewPanelOpen: boolean
  setApiPreviewPanelOpen: (apiPreviewPanelOpen: boolean) => void
  refreshDocs: () => void
}

const GridHeaderActions = ({
  table,
  apiPreviewPanelOpen,
  setApiPreviewPanelOpen,
  refreshDocs,
}: GridHeaderActionsProps) => {
  const { meta } = useStore()
  const { project } = useProjectContext()
  const projectRef = project?.ref
  const policies = meta.policies.list((policy: PostgresPolicy) => policy.table_id === table.id)

  const canSqlWriteTables = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'tables')
  const canSqlWriteColumns = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'columns')
  const isReadOnly = !canSqlWriteTables && !canSqlWriteColumns

  function handlePreviewToggle() {
    setApiPreviewPanelOpen(!apiPreviewPanelOpen)
    refreshDocs()
  }

  const RenderAPIPreviewToggle = () => {
    return (
      <Button
        size="tiny"
        type="default"
        icon={<IconCode size={14} strokeWidth={2} />}
        onClick={handlePreviewToggle}
      >
        API
      </Button>
    )
  }

  return (
    <div className="flex items-center space-x-3">
      {isReadOnly && (
        <Tooltip.Root delayDuration={0}>
          <Tooltip.Trigger className="w-full">
            <div className="border border-scale-700 rounded bg-scale-500 px-3 py-1 text-xs">
              Viewing as read-only
            </div>
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content side="bottom">
              <Tooltip.Arrow className="radix-tooltip-arrow" />
              <div
                className={[
                  'rounded bg-scale-100 py-1 px-2 leading-none shadow',
                  'border border-scale-200',
                ].join(' ')}
              >
                <span className="text-xs text-scale-1200">
                  You need additional permissions to manage your project's data
                </span>
              </div>
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
      )}

      <Link href={`/project/${projectRef}/auth/policies?search=${table.id}`}>
        <a>
          <Button
            type={table.rls_enabled ? 'link' : 'warning'}
            icon={
              table.rls_enabled ? (
                <IconLock strokeWidth={2} size={14} />
              ) : (
                <IconAlertCircle strokeWidth={2} size={14} />
              )
            }
          >
            {!table.rls_enabled
              ? 'RLS is not enabled'
              : `${policies.length == 0 ? 'No' : policies.length} active RLS polic${
                  policies.length > 1 || policies.length == 0 ? 'ies' : 'y'
                }`}
          </Button>
        </a>
      </Link>
      <div className="mt-[1px]">
        <RenderAPIPreviewToggle />
      </div>
    </div>
  )
}

export default GridHeaderActions
