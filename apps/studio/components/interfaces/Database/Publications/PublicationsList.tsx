import { PermissionAction } from '@supabase/shared-types/out/constants'
import { noop } from 'lodash'
import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import { Button, IconAlertCircle, IconSearch, Input, Modal, Toggle } from 'ui'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import Table from 'components/to-be-cleaned/Table'
import ConfirmationModal from 'components/ui/ConfirmationModal'
import InformationBox from 'components/ui/InformationBox'
import NoSearchResults from 'components/ui/NoSearchResults'
import { useDatabasePublicationsQuery } from 'data/database-publications/database-publications-query'
import { useDatabasePublicationUpdateMutation } from 'data/database-publications/database-publications-update-mutation'
import { useCheckPermissions, usePermissionsLoaded } from 'hooks'
import PublicationSkeleton from './PublicationSkeleton'
import toast from 'react-hot-toast'

interface PublicationEvent {
  event: string
  key: string
}

interface PublicationsListProps {
  onSelectPublication: (id: number) => void
}

const PublicationsList = ({ onSelectPublication = noop }: PublicationsListProps) => {
  const { project } = useProjectContext()
  const [filterString, setFilterString] = useState<string>('')

  const { data, isLoading } = useDatabasePublicationsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const { mutate: updatePublications } = useDatabasePublicationUpdateMutation({
    onSuccess: () => {
      toast.success('Successfully updated event')
      setToggleListenEventValue(null)
    },
  })
  console.log(data)

  const canUpdatePublications = useCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_WRITE,
    'publications'
  )
  const isPermissionsLoaded = usePermissionsLoaded()

  const publicationEvents: PublicationEvent[] = [
    { event: 'Insert', key: 'publish_insert' },
    { event: 'Update', key: 'publish_update' },
    { event: 'Delete', key: 'publish_delete' },
    { event: 'Truncate', key: 'publish_truncate' },
  ]
  const publications =
    filterString.length === 0
      ? data ?? []
      : (data ?? []).filter((publication) => publication.name.includes(filterString))

  const [toggleListenEventValue, setToggleListenEventValue] = useState<{
    publication: any
    event: PublicationEvent
    currentStatus: any
  } | null>(null)

  const toggleListenEvent = async () => {
    if (!toggleListenEventValue || !project) return

    const { publication, event, currentStatus } = toggleListenEventValue
    const payload = {
      projectRef: project.ref,
      connectionString: project.connectionString,
      id: publication.id,
    } as any
    payload[`publish_${event.event.toLowerCase()}`] = !currentStatus
    updatePublications(payload)
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
          {isPermissionsLoaded && !canUpdatePublications && (
            <div className="w-[500px]">
              <InformationBox
                icon={<IconAlertCircle className="text-foreground-light" strokeWidth={2} />}
                title="You need additional permissions to update database replications"
              />
            </div>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded">
        <Table
          head={[
            <Table.th key="header.name" style={{ width: '25%' }}>
              Name
            </Table.th>,
            <Table.th key="header.id" className="hidden lg:table-cell" style={{ width: '25%' }}>
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
          body={
            isLoading
              ? Array.from({ length: 5 }).map((_, i) => <PublicationSkeleton key={i} index={i} />)
              : publications.map((x) => (
                  <Table.tr className="border-t" key={x.name}>
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
                          checked={(x as any)[event.key]}
                          disabled={!canUpdatePublications}
                          onChange={() => {
                            setToggleListenEventValue({
                              publication: x,
                              event,
                              currentStatus: (x as any)[event.key],
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
                ))
          }
        />

        {!isLoading && publications.length === 0 && (
          <NoSearchResults
            searchString={filterString}
            onResetFilter={() => setFilterString('')}
            className="rounded-t-none border-t-0"
          />
        )}
      </div>

      <ConfirmationModal
        visible={toggleListenEventValue !== null}
        header={`Confirm to toggle sending ${toggleListenEventValue?.event.event.toLowerCase()} events`}
        buttonLabel="Confirm"
        buttonLoadingLabel="Updating"
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
