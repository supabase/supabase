import Link from 'next/link'
import { useRouter } from 'next/router'
import { forwardRef, useCallback, useState } from 'react'
import {
  Button,
  DropdownMenuContent_Shadcn_,
  DropdownMenuItem_Shadcn_,
  DropdownMenuSeparator_Shadcn_,
  DropdownMenuTrigger_Shadcn_,
  DropdownMenu_Shadcn_,
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
  onDeleteConnection: (connection: IntegrationProjectConnection) => void | Promise<void>
}

const IntegrationConnectionItem = forwardRef<HTMLLIElement, IntegrationConnectionItemProps>(
  ({ onDeleteConnection, ...props }, ref) => {
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
            <DropdownMenu_Shadcn_
              open={dropdownVisible}
              onOpenChange={() => setDropdownVisible(!dropdownVisible)}
              modal={false}
            >
              <DropdownMenuTrigger_Shadcn_>
                <Button asChild iconRight={<IconChevronDown />} type="default">
                  <span>Manage</span>
                </Button>
              </DropdownMenuTrigger_Shadcn_>
              <DropdownMenuContent_Shadcn_ side="bottom" align="end">
                {props.type === 'Vercel' && (
                  <>
                    {router.pathname !== projectIntegrationUrl && (
                      <Link
                        passHref
                        href={projectIntegrationUrl.replace(
                          '[ref]',
                          props.connection.supabase_project_ref
                        )}
                      >
                        <a>
                          <DropdownMenuItem_Shadcn_ disabled={isSyncEnvLoading}>
                            View project configuration
                          </DropdownMenuItem_Shadcn_>
                        </a>
                      </Link>
                    )}
                    <DropdownMenuItem_Shadcn_
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
                    </DropdownMenuItem_Shadcn_>
                    <DropdownMenuSeparator_Shadcn_ />
                  </>
                )}
                <DropdownMenuItem_Shadcn_ className="space-x-2" onSelect={() => setIsOpen(true)}>
                  <IconTrash size={14} />
                  <p>Delete connection</p>
                </DropdownMenuItem_Shadcn_>
              </DropdownMenuContent_Shadcn_>
            </DropdownMenu_Shadcn_>
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
            <p className="py-4 text-sm text-light">
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
