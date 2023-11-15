import Link from 'next/link'
import { useRouter } from 'next/router'
import { forwardRef, useCallback, useState } from 'react'
import {
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

import {
  IntegrationConnection,
  IntegrationConnectionProps,
} from 'components/interfaces/Integrations/IntegrationPanels'
import ConfirmationModal from 'components/ui/ConfirmationModal'
import { useIntegrationsVercelConnectionSyncEnvsMutation } from 'data/integrations/integrations-vercel-connection-sync-envs-mutation'
import { IntegrationProjectConnection } from 'data/integrations/integrations.types'
import { useStore } from 'hooks'

interface IntegrationConnectionItemProps extends IntegrationConnectionProps {
  disabled?: boolean
  onDeleteConnection: (connection: IntegrationProjectConnection) => void | Promise<void>
}

const IntegrationConnectionItem = forwardRef<HTMLLIElement, IntegrationConnectionItemProps>(
  ({ disabled, onDeleteConnection, ...props }, ref) => {
    const { ui } = useStore()
    const [isOpen, setIsOpen] = useState(false)
    const [dropdownVisible, setDropdownVisible] = useState(false)

    const router = useRouter()

    const onConfirm = useCallback(async () => {
      try {
        await onDeleteConnection(props.connection)
      } finally {
        setIsOpen(false)
      }
    }, [props.connection, onDeleteConnection])

    const onCancel = useCallback(() => {
      setIsOpen(false)
    }, [])

    const { mutate: syncEnvs, isLoading: isSyncEnvLoading } =
      useIntegrationsVercelConnectionSyncEnvsMutation({
        onSuccess: () => {
          ui.setNotification({
            category: 'success',
            message: 'Successfully synced environment variables',
          })
          setDropdownVisible(false)
        },
      })

    const onReSyncEnvVars = useCallback(async () => {
      syncEnvs({ connectionId: props.connection.id })
    }, [props.connection, syncEnvs])

    const projectIntegrationUrl = `/project/[ref]/settings/integrations`

    return (
      <>
        <IntegrationConnection
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
                <DropdownMenuTrigger>
                  <Button asChild iconRight={<IconChevronDown />} type="default">
                    <span>Manage</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="bottom" align="end">
                  {props.type === 'Vercel' && (
                    <>
                      {router.pathname !== projectIntegrationUrl && (
                        <DropdownMenuItem disabled={isSyncEnvLoading} asChild>
                          <Link
                            href={projectIntegrationUrl.replace(
                              '[ref]',
                              props.connection.supabase_project_ref
                            )}
                          >
                            View project configuration
                          </Link>
                        </DropdownMenuItem>
                      )}
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
                      <DropdownMenuSeparator />
                    </>
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
          visible={isOpen}
          danger={true}
          header="Confirm to delete"
          buttonLabel="Delete"
          onSelectCancel={onCancel}
          onSelectConfirm={onConfirm}
        >
          <Modal.Content>
            <p className="py-4 text-sm text-foreground-light">
              {`This action cannot be undone. Are you sure you want to delete this connection?`}
            </p>
          </Modal.Content>
        </ConfirmationModal>
      </>
    )
  }
)

IntegrationConnectionItem.displayName = 'IntegrationConnectionItem'

export { IntegrationConnectionItem }
