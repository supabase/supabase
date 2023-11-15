import { PermissionAction } from '@supabase/shared-types/out/constants'
import { noop } from 'lodash'
import { observer } from 'mobx-react-lite'
import { useState } from 'react'

import Table from 'components/to-be-cleaned/Table'
import ConfirmationModal from 'components/ui/ConfirmationModal'
import InformationBox from 'components/ui/InformationBox'
import NoSearchResults from 'components/ui/NoSearchResults'
import { useCheckPermissions, useStore } from 'hooks'
import { Button, IconAlertCircle, IconSearch, Input, Modal, Toggle } from 'ui'

interface PublicationEvent {
  event: string
  key: string
}

interface PublicationsListProps {
  onSelectPublication: (id: number) => void
}

const PublicationsList = ({ onSelectPublication = noop }: PublicationsListProps) => {
  const { ui, meta } = useStore()
  const [filterString, setFilterString] = useState<string>('')

  const canUpdatePublications = useCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_WRITE,
    'publications'
  )

  const publicationEvents: PublicationEvent[] = [
    { event: 'Insert', key: 'publish_insert' },
    { event: 'Update', key: 'publish_update' },
    { event: 'Delete', key: 'publish_delete' },
    { event: 'Truncate', key: 'publish_truncate' },
  ]
  const publications =
    filterString.length === 0
      ? meta.publications.list()
      : meta.publications.list((publication: any) => publication.name.includes(filterString))

  const [toggleListenEventValue, setToggleListenEventValue] = useState<{
    publication: any
    event: PublicationEvent
    currentStatus: any
  } | null>(null)

  const toggleListenEvent = async () => {
    if (!toggleListenEventValue) return

    const { publication, event, currentStatus } = toggleListenEventValue

    try {
      let payload: any = { id: publication.id }
      payload[`publish_${event.event.toLowerCase()}`] = !currentStatus
      const { data, error }: any = await meta.publications.update(publication.id, payload)
      if (error) {
        throw error
      } else {
        setToggleListenEventValue(null)
        return data
      }
    } catch (error: any) {
      ui.setNotification({
        category: 'error',
        message: `Failed to toggle for ${publication.name}: ${error.message}`,
      })
      return false
    }
  }

  return (
    <>
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Input
              size="small"
              icon={<IconSearch size="tiny" />}
              placeholder={'Filter'}
              value={filterString}
              onChange={(e) => setFilterString(e.target.value)}
            />
          </div>
          {!canUpdatePublications && (
            <div className="w-[500px]">
              <InformationBox
                icon={<IconAlertCircle className="text-foreground-light" strokeWidth={2} />}
                title="You need additional permissions to update database replications"
              />
            </div>
          )}
        </div>
      </div>
      {publications.length === 0 ? (
        <NoSearchResults searchString={filterString} onResetFilter={() => setFilterString('')} />
      ) : (
        <div className="overflow-hidden rounded">
          <Table
            head={[
              <Table.th key="header.name">Name</Table.th>,
              <Table.th key="header.id" className="hidden lg:table-cell">
                System ID
              </Table.th>,
              <Table.th key="header.insert">Insert</Table.th>,
              <Table.th key="header.update">Update</Table.th>,
              <Table.th key="header.delete">Delete</Table.th>,
              <Table.th key="header.truncate">Truncate</Table.th>,
              <Table.th key="header.source" className="text-right">
                Source
              </Table.th>,
            ]}
            body={publications.map((x, i) => (
              <Table.tr className="border-t " key={x.name}>
                <Table.td className="px-4 py-3" style={{ width: '25%' }}>
                  {x.name}
                </Table.td>
                <Table.td className="hidden lg:table-cell" style={{ width: '25%' }}>
                  {x.id}
                </Table.td>
                {publicationEvents.map((event) => (
                  <Table.td key={event.key}>
                    <Toggle
                      size="tiny"
                      checked={x[event.key]}
                      disabled={!canUpdatePublications}
                      onChange={() => {
                        setToggleListenEventValue({
                          publication: x,
                          event,
                          currentStatus: x[event.key],
                        })
                      }}
                    />
                  </Table.td>
                ))}
                <Table.td className="px-4 py-3 pr-2">
                  <div className="flex justify-end gap-2">
                    <Button
                      type="default"
                      style={{ paddingTop: 3, paddingBottom: 3 }}
                      onClick={() => onSelectPublication(x.id)}
                    >
                      {x.tables == null
                        ? 'All tables'
                        : `${x.tables.length} ${
                            x.tables.length > 1 || x.tables.length == 0 ? 'tables' : 'table'
                          }`}
                    </Button>
                  </div>
                </Table.td>
              </Table.tr>
            ))}
          />
        </div>
      )}

      <ConfirmationModal
        visible={toggleListenEventValue !== null}
        header="Confirm"
        buttonLabel="Confirm"
        onSelectCancel={() => setToggleListenEventValue(null)}
        onSelectConfirm={() => {
          toggleListenEvent()
        }}
      >
        <Modal.Content>
          <p className="py-4 text-sm text-foreground-light">
            Are you sure you want to {toggleListenEventValue?.currentStatus ? 'stop' : 'start'}{' '}
            sending {toggleListenEventValue?.event.event.toLowerCase()} events for{' '}
            {toggleListenEventValue?.publication.name}?
          </p>
        </Modal.Content>
      </ConfirmationModal>
    </>
  )
}

export default observer(PublicationsList)
