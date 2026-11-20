import {
  ChevronDownIcon,
  Loader2Icon,
  MoreVerticalIcon,
  RefreshCwIcon,
  SettingsIcon,
  TrashIcon,
} from 'lucide-react'
import Link from 'next/link'
import { forwardRef, useCallback, useState } from 'react'
import { toast } from 'sonner'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

import {
  IntegrationConnection,
  IntegrationConnectionProps,
} from '@/components/interfaces/Integrations/VercelGithub/IntegrationPanels'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { useIntegrationsVercelConnectionSyncEnvsMutation } from '@/data/integrations/integrations-vercel-connection-sync-envs-mutation'
import type { IntegrationProjectConnection } from '@/data/integrations/integrations.types'
import { useProjectDetailQuery } from '@/data/projects/project-detail-query'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'

interface IntegrationConnectionItemProps extends IntegrationConnectionProps {
  disabled?: boolean
  isProjectScoped?: boolean
  onDeleteConnection: (connection: IntegrationProjectConnection) => void | Promise<void>
}

export const IntegrationConnectionItem = forwardRef<HTMLLIElement, IntegrationConnectionItemProps>(
  ({ disabled, isProjectScoped = false, onDeleteConnection, ...props }, _ref) => {
    const { data: org } = useSelectedOrganizationQuery()

    const { type, connection } = props
    const { data: project } = useProjectDetailQuery({ ref: connection.supabase_project_ref })
    const isBranchingEnabled = project?.is_branch_enabled === true

    const [isOpen, setIsOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [dropdownVisible, setDropdownVisible] = useState(false)

    const onConfirm = useCallback(async () => {
      try {
        setIsDeleting(true)
        await onDeleteConnection(connection)
      } catch (error) {
        // [Joshen] No need for error handler
      } finally {
        setIsDeleting(false)
        setIsOpen(false)
      }
    }, [connection, onDeleteConnection])

    const onCancel = useCallback(() => {
      setIsOpen(false)
    }, [])

    const { mutate: syncEnvs, isPending: isSyncEnvLoading } =
      useIntegrationsVercelConnectionSyncEnvsMutation({
        onSuccess: () => {
          toast.success('Successfully synced environment variables')
          setDropdownVisible(false)
        },
      })

    const onReSyncEnvVars = useCallback(async () => {
      syncEnvs({ connectionId: connection.id })
    }, [connection, syncEnvs])

    const projectIntegrationUrl = `/project/[ref]/settings/integrations`

    // Project-scoped Vercel rows have their own "Edit" toggle, so "Manage" collapses to an icon
    const isManageCompact = isProjectScoped && type === 'Vercel'
    const triggerLabel = isManageCompact ? null : 'Manage'
    const triggerProps = isManageCompact
      ? { icon: <MoreVerticalIcon />, className: 'px-1.5', 'aria-label': 'Manage connection' }
      : { iconRight: <ChevronDownIcon size={14} /> }

    return (
      <>
        <IntegrationConnection
          showNode={false}
          actions={
            disabled ? (
              <ButtonTooltip
                disabled
                {...triggerProps}
                tooltip={{
                  content: {
                    side: 'bottom',
                    text: 'You need additional permissions to manage this connection',
                  },
                }}
              >
                {triggerLabel}
              </ButtonTooltip>
            ) : (
              <DropdownMenu
                open={dropdownVisible}
                onOpenChange={() => setDropdownVisible(!dropdownVisible)}
                modal={false}
              >
                <DropdownMenuTrigger asChild>
                  <Button {...triggerProps}>{triggerLabel}</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="bottom" align="end" className="w-56">
                  {!isProjectScoped && (
                    <DropdownMenuItem asChild className="gap-x-2">
                      <Link
                        href={
                          projectIntegrationUrl.replace('[ref]', connection.supabase_project_ref) +
                          `#${type.toLowerCase()}`
                        }
                      >
                        <SettingsIcon size={14} />
                        Configure connection
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {type === 'Vercel' && org?.managed_by !== 'vercel-marketplace' && (
                    <DropdownMenuItem
                      className="space-x-2"
                      onSelect={(event) => {
                        event.preventDefault()
                        onReSyncEnvVars()
                      }}
                      disabled={isSyncEnvLoading}
                    >
                      {isSyncEnvLoading ? (
                        <Loader2Icon className="animate-spin" size={14} />
                      ) : (
                        <RefreshCwIcon size={14} />
                      )}
                      <p>Resync environment variables</p>
                    </DropdownMenuItem>
                  )}
                  {((type === 'Vercel' && org?.managed_by !== 'vercel-marketplace') ||
                    !isProjectScoped) && <DropdownMenuSeparator />}
                  <DropdownMenuItem className="space-x-2" onSelect={() => setIsOpen(true)}>
                    <TrashIcon size={14} />
                    <p>Delete connection</p>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )
          }
          {...props}
        />

        <ConfirmationModal
          variant="destructive"
          size={type === 'GitHub' && isBranchingEnabled ? 'medium' : 'small'}
          visible={isOpen}
          title={`Confirm to delete ${type} connection`}
          confirmLabel="Delete connection"
          onCancel={onCancel}
          onConfirm={onConfirm}
          loading={isDeleting}
        >
          <p className="text-sm text-foreground-light">
            {type === 'Vercel'
              ? 'Deleting this Vercel connection will stop syncing environment variables to your Vercel project. Existing environment variables will remain unchanged.'
              : 'Deleting this GitHub connection will stop automatic creation and merging of preview branches. Existing preview branches will remain unchanged.'}
          </p>
        </ConfirmationModal>
      </>
    )
  }
)

IntegrationConnectionItem.displayName = 'IntegrationConnectionItem'
