import Link from 'next/link'
import { useRouter } from 'next/router'
import { forwardRef, useCallback, useState } from 'react'
import toast from 'react-hot-toast'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  IconChevronDown,
  IconLoader,
  IconRefreshCw,
  IconTrash,
  Modal,
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

import {
  IntegrationConnection,
  IntegrationConnectionProps,
} from 'components/interfaces/Integrations/IntegrationPanels'
import { useIntegrationsVercelConnectionSyncEnvsMutation } from 'data/integrations/integrations-vercel-connection-sync-envs-mutation'
import type { IntegrationProjectConnection } from 'data/integrations/integrations.types'
import { useProjectsQuery } from 'data/projects/projects-query'
import { WarningIcon } from 'ui-patterns/Icons/StatusIcons'

interface IntegrationConnectionItemProps extends IntegrationConnectionProps {
  disabled?: boolean
  onDeleteConnection: (connection: IntegrationProjectConnection) => void | Promise<void>
}

const IntegrationConnectionItem = forwardRef<HTMLLIElement, IntegrationConnectionItemProps>(
  ({ disabled, onDeleteConnection, ...props }, ref) => {
    const router = useRouter()

    const { type, connection } = props
    const { data: projects } = useProjectsQuery()
    const project = projects?.find((project) => project.ref === connection.supabase_project_ref)
    const isBranchingEnabled = project?.is_branch_enabled === true

    const [isOpen, setIsOpen] = useState(false)
    const [dropdownVisible, setDropdownVisible] = useState(false)

    const onConfirm = useCallback(async () => {
      try {
        await onDeleteConnection(connection)
      } finally {
        setIsOpen(false)
      }
    }, [connection, onDeleteConnection])

    const onCancel = useCallback(() => {
      setIsOpen(false)
    }, [])

    const { mutate: syncEnvs, isLoading: isSyncEnvLoading } =
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

    return (
      <>
        <IntegrationConnection
          showNode={false}
          actions={
            disabled ? (
              <Button asChild disabled iconRight={<IconChevronDown />} type="default">
                <span>Manage</span>
              </Button>
            ) : (
              <DropdownMenu
                open={dropdownVisible}
                onOpenChange={() => setDropdownVisible(!dropdownVisible)}
                modal={false}
              >
                <DropdownMenuTrigger asChild>
                  <Button iconRight={<IconChevronDown />} type="default">
                    <span>Manage</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="bottom" align="end">
                  {router.pathname !== projectIntegrationUrl && (
                    <DropdownMenuItem asChild>
                      <Link
                        href={projectIntegrationUrl.replace(
                          '[ref]',
                          connection.supabase_project_ref
                        )}
                      >
                        Configure connection
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {type === 'Vercel' && (
                    <DropdownMenuItem
                      className="space-x-2"
                      onSelect={(event) => {
                        event.preventDefault()
                        onReSyncEnvVars()
                      }}
                      disabled={isSyncEnvLoading}
                    >
                      {isSyncEnvLoading ? (
                        <IconLoader className="animate-spin" size={14} />
                      ) : (
                        <IconRefreshCw size={14} />
                      )}
                      <p>Resync environment variables</p>
                    </DropdownMenuItem>
                  )}
                  {(type === 'Vercel' || router.pathname !== projectIntegrationUrl) && (
                    <DropdownMenuSeparator />
                  )}
                  <DropdownMenuItem className="space-x-2" onSelect={() => setIsOpen(true)}>
                    <IconTrash size={14} />
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
          alert={
            type === 'GitHub' && isBranchingEnabled
              ? {
                  title: 'Branching will be disabled for this project',
                  description: ` Deleting this GitHub connection will remove all preview branches on this project,
                and also disable branching for ${project.name}`,
                }
              : {}
          }
        >
          <p className="text-sm text-foreground-light">
            This action cannot be undone. Are you sure you want to delete this {type} connection?
          </p>
        </ConfirmationModal>
      </>
    )
  }
)

IntegrationConnectionItem.displayName = 'IntegrationConnectionItem'

export { IntegrationConnectionItem }
