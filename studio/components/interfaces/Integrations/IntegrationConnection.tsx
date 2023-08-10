import {
  IntegrationConnection,
  IntegrationConnectionProps,
} from 'components/interfaces/Integrations/IntegrationPanels'
import ConfirmationModal from 'components/ui/ConfirmationModal'
import { useIntegrationsVercelConnectionSyncEnvsMutation } from 'data/integrations/integrations-vercel-connection-sync-envs-mutation'
import { IntegrationProjectConnection } from 'data/integrations/integrations.types'
import { BASE_PATH } from 'lib/constants'
import { useRouter } from 'next/router'
import React, { useCallback, useState } from 'react'
import { Button, Dropdown, IconChevronDown, IconLoader, IconRefreshCw, IconTrash, Modal } from 'ui'

interface IntegrationConnectionItemProps extends IntegrationConnectionProps {
  onDeleteConnection: (connection: IntegrationProjectConnection) => void | Promise<void>
}

const IntegrationConnectionItem = React.forwardRef<HTMLLIElement, IntegrationConnectionItemProps>(
  ({ onDeleteConnection, ...props }, ref) => {
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

    const { mutateAsync: syncEnvs, isLoading: isSyncEnvLoading } =
      useIntegrationsVercelConnectionSyncEnvsMutation()

    const onReSyncEnvVars = useCallback(async () => {
      try {
        await syncEnvs({ connectionId: props.connection.id })
      } finally {
        setDropdownVisible(false)
      }
    }, [props.connection, syncEnvs])

    const projectIntegrationUrl = `/project/[ref]/settings/integrations`

    console.log(router)
    return (
      <>
        <IntegrationConnection
          actions={
            <Dropdown
              open={dropdownVisible}
              onOpenChange={() => setDropdownVisible(!dropdownVisible)}
              modal={false}
              side="bottom"
              align="end"
              size="medium"
              overlay={
                <>
                  {props.type === 'Vercel' && (
                    <>
                      {router.pathname !== projectIntegrationUrl && (
                        <Dropdown.Item
                          onSelect={() => {
                            router.push(projectIntegrationUrl)
                          }}
                          disabled={isSyncEnvLoading}
                        >
                          View project configuration
                        </Dropdown.Item>
                      )}
                      <Dropdown.Item
                        icon={
                          isSyncEnvLoading ? (
                            <IconLoader className="animate-spin" size={14} />
                          ) : (
                            <IconRefreshCw size={14} />
                          )
                        }
                        onSelect={(event) => {
                          event.preventDefault()
                          onReSyncEnvVars()
                        }}
                        disabled={isSyncEnvLoading}
                      >
                        Resync environment variables
                      </Dropdown.Item>
                      <Dropdown.Separator />
                    </>
                  )}
                  <Dropdown.Item icon={<IconTrash size={14} />} onSelect={() => setIsOpen(true)}>
                    Delete connection
                  </Dropdown.Item>
                </>
              }
            >
              <Button asChild iconRight={<IconChevronDown />} type="default">
                <span>Manage</span>
              </Button>
            </Dropdown>
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
