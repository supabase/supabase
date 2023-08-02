import {
  EmptyIntegrationConnection,
  IntegrationConnection,
  IntegrationConnectionHeader,
  IntegrationInstallation,
  IntegrationConnectionProps,
} from 'components/interfaces/Integrations/IntegrationPanels'
import { Markdown } from 'components/interfaces/Markdown'
import {
  ScaffoldContainer,
  ScaffoldSection,
  ScaffoldSectionContent,
  ScaffoldSectionDetail,
} from 'components/layouts/Scaffold'
import ConfirmationModal from 'components/ui/ConfirmationModal'
import { useIntegrationsVercelConnectionSyncEnvsMutation } from 'data/integrations/integrations-vercel-connection-sync-envs-mutation'
import {
  IntegrationName,
  IntegrationProjectConnection,
  Integration as TIntegration,
} from 'data/integrations/integrations.types'
import { BASE_PATH } from 'lib/constants'
import { pluralize } from 'lib/helpers'
import { EMPTY_ARR } from 'lib/void'
import React, { forwardRef, useCallback, useState } from 'react'
import { Button, Dropdown, IconChevronDown, IconTrash, Modal, IconLoader, IconRefreshCw } from 'ui'

export interface IntegrationProps {
  title: string
  description?: string
  note?: string
  detail?: string
  integrations?: TIntegration[]
  onAddConnection: (integrationId: string) => void
  onDeleteConnection: (connection: IntegrationProjectConnection) => void | Promise<void>
}

// const OrganizationIntegration = ({
//   title,
//   description,
//   note,
//   detail,
//   integrations = EMPTY_ARR,
//   onAddConnection,
//   onDeleteConnection,
// }: IntegrationProps) => {
//   const ConnectionHeading = ({ integration }: { integration: TIntegration }) => {
//     return (
//       <IntegrationConnectionHeader
//         markdown={`### ${integration.connections.length} project ${pluralize(
//           integration.connections.length,
//           'connection'
//         )}
// Repository connections for ${title?.toLowerCase()}
//       `}
//       />
//     )
//   }

//   return (
//     <>
//       <ScaffoldContainer>
//         <ScaffoldSection>
//           <ScaffoldSectionDetail>
//             {detail && <Markdown content={detail} />}
//             <img
//               className="border rounded-lg shadow w-48 mt-6 border-body"
//               src={`${BASE_PATH}/img/integrations/covers/${title.toLowerCase()}-cover.png?v=3`}
//               alt="cover"
//             />
//           </ScaffoldSectionDetail>
//           <ScaffoldSectionContent>
//             <Markdown content={`${description}`} />
//             <div className="flex flex-col gap-12">
//               {integrations.length > 0 &&
//                 integrations.map((integration, i) => {
//                   return (
//                     <div key={integration.id}>
//                       <IntegrationInstallation title={title} integration={integration} />

//                       {integration.connections.length > 0 ? (
//                         <>
//                           <ConnectionHeading integration={integration} />

//                           <ul className="flex flex-col">
//                             {integration.connections.map((connection) => (
//                               <IntegrationConnectionItem
//                                 key={connection.id}
//                                 connection={connection}
//                                 type={title as IntegrationName}
//                                 onDeleteConnection={onDeleteConnection}
//                               />
//                             ))}
//                           </ul>
//                         </>
//                       ) : (
//                         <ConnectionHeading integration={integration} />
//                       )}
//                       <EmptyIntegrationConnection onClick={() => onAddConnection(integration.id)}>
//                         Add new project connection
//                       </EmptyIntegrationConnection>
//                     </div>
//                   )
//                 })}
//             </div>
//             {note !== undefined && <Markdown content={note} className="text-scale-900" />}
//           </ScaffoldSectionContent>
//         </ScaffoldSection>
//       </ScaffoldContainer>
//     </>
//   )
// }

interface IntegrationConnectionItemProps extends IntegrationConnectionProps {
  onDeleteConnection: (connection: IntegrationProjectConnection) => void | Promise<void>
}

const IntegrationConnectionItem = React.forwardRef<HTMLLIElement, IntegrationConnectionItemProps>(
  ({ onDeleteConnection, ...props }, ref) => {
    const [isOpen, setIsOpen] = useState(false)
    const [dropdownVisible, setDropdownVisible] = useState(false)

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

    return (
      <>
        <IntegrationConnection
          connection={props.connection}
          type={props.type}
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
