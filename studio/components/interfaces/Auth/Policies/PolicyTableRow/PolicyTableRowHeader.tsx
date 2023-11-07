import * as Tooltip from '@radix-ui/react-tooltip'
import type { PostgresTable } from '@supabase/postgres-meta'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { noop } from 'lodash'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Badge, Button, IconLock } from 'ui'

import { useCheckPermissions } from 'hooks'

interface PolicyTableRowHeaderProps {
  table: PostgresTable
  isLocked: boolean
  onSelectToggleRLS: (table: PostgresTable) => void
  onSelectCreatePolicy: (table: PostgresTable) => void
}

const PolicyTableRowHeader = ({
  table,
  isLocked,
  onSelectToggleRLS = noop,
  onSelectCreatePolicy = noop,
}: PolicyTableRowHeaderProps) => {
  const router = useRouter()
  const { ref } = router.query
  const canToggleRLS = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'tables')
  const canCreatePolicies = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'policies')

  return (
    <div id={table.id.toString()} className="flex w-full items-center justify-between">
      <div className="flex space-x-4 text-left">
        <Link href={`/project/${ref}/editor/${table.id}`}>
          <h4 className="m-0">{table.name}</h4>
        </Link>
        {isLocked ? (
          <Badge color="scale">
            <span className="flex gap-2 items-center text-xs uppercase text-foreground-lighter">
              <IconLock width={12} /> Locked
            </span>
          </Badge>
        ) : (
          <Badge color={table.rls_enabled ? 'green' : 'yellow'}>
            {table.rls_enabled ? 'RLS enabled' : 'RLS disabled'}
          </Badge>
        )}
      </div>
      {!isLocked && (
        <div className="flex-1">
          <div className="flex flex-row-reverse">
            <Tooltip.Root delayDuration={0}>
              <Tooltip.Trigger>
                <Button
                  type="outline"
                  disabled={!canCreatePolicies}
                  className="ml-2"
                  onClick={() => onSelectCreatePolicy(table)}
                >
                  New Policy
                </Button>
              </Tooltip.Trigger>
              {!canCreatePolicies && (
                <Tooltip.Portal>
                  <Tooltip.Content side="bottom">
                    <Tooltip.Arrow className="radix-tooltip-arrow" />
                    <div
                      className={[
                        'rounded bg-alternative py-1 px-2 leading-none shadow',
                        'border border-background',
                      ].join(' ')}
                    >
                      <span className="text-xs text-foreground">
                        You need additional permissions to create RLS policies
                      </span>
                    </div>
                  </Tooltip.Content>
                </Tooltip.Portal>
              )}
            </Tooltip.Root>
            <Tooltip.Root delayDuration={0}>
              <Tooltip.Trigger>
                <Button
                  type="default"
                  disabled={!canToggleRLS}
                  onClick={() => onSelectToggleRLS(table)}
                >
                  {table.rls_enabled ? 'Disable RLS' : 'Enable RLS'}
                </Button>
              </Tooltip.Trigger>
              {!canToggleRLS && (
                <Tooltip.Portal>
                  <Tooltip.Content side="bottom">
                    <Tooltip.Arrow className="radix-tooltip-arrow" />
                    <div
                      className={[
                        'rounded bg-alternative py-1 px-2 leading-none shadow',
                        'border border-background',
                      ].join(' ')}
                    >
                      <span className="text-xs text-foreground">
                        You need additional permissions to toggle RLS
                      </span>
                    </div>
                  </Tooltip.Content>
                </Tooltip.Portal>
              )}
            </Tooltip.Root>
          </div>
        </div>
      )}
    </div>
  )
}

export default PolicyTableRowHeader
