import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useState } from 'react'
import { toast } from 'sonner'
import { Toggle } from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import Table from 'components/to-be-cleaned/Table'
import InformationBox from 'components/ui/InformationBox'
import { useDatabasePublicationsQuery } from 'data/database-publications/database-publications-query'
import { useDatabasePublicationUpdateMutation } from 'data/database-publications/database-publications-update-mutation'
import { useCheckPermissions, usePermissionsLoaded } from 'hooks/misc/useCheckPermissions'
import SkeletonTableRow from 'components/ui/SkeletonTableRow'
import { AlertCircle } from 'lucide-react'

interface PublicationEvent {
  event: string
  key: string
}

interface SinglePublicationViewProps {
  publicationName: string
}

const SinglePublicationView = ({ publicationName }: SinglePublicationViewProps) => {
  const { project } = useProjectContext()

  const { data: publication, isLoading } = useDatabasePublicationsQuery(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
    },
    {
      select: (data) => data.find((pub) => pub.name === publicationName),
    }
  )

  const { mutate: updatePublications } = useDatabasePublicationUpdateMutation({
    onSuccess: () => {
      toast.success('Successfully updated event')
      setToggleListenEventValue(null)
    },
  })

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
      {isPermissionsLoaded && !canUpdatePublications && (
        <div className="mb-4">
          <InformationBox
            icon={<AlertCircle className="text-foreground-light" strokeWidth={2} />}
            title="You need additional permissions to update database publications"
          />
        </div>
      )}

      <Table
        head={[
          <Table.th key="header.event">Event Type</Table.th>,
          <Table.th key="header.status">
            <span className="sr-only">Enabled</span>
          </Table.th>,
        ]}
        body={
          isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <SkeletonTableRow
                key={i}
                index={i}
                columns={[
                  { key: 'event', width: '50%' },
                  { key: 'status', isToggle: true, align: 'end' },
                ]}
              />
            ))
          ) : publication ? (
            publicationEvents.map((event) => (
              <Table.tr key={event.key} className="border-t">
                <Table.td className="px-4 py-3">{event.event}</Table.td>
                <Table.td>
                  <div className="flex justify-end gap-2">
                    <Toggle
                      size="tiny"
                      checked={(publication as any)[event.key]}
                      disabled={!canUpdatePublications}
                      onChange={() => {
                        setToggleListenEventValue({
                          publication,
                          event,
                          currentStatus: (publication as any)[event.key],
                        })
                      }}
                    />
                  </div>
                </Table.td>
              </Table.tr>
            ))
          ) : (
            <Table.tr>
              <Table.td colSpan={2}>No publication found</Table.td>
            </Table.tr>
          )
        }
      />

      <ConfirmationModal
        visible={toggleListenEventValue !== null}
        title={`Confirm to toggle sending ${toggleListenEventValue?.event.event.toLowerCase()} events`}
        confirmLabel="Confirm"
        confirmLabelLoading="Updating"
        onCancel={() => setToggleListenEventValue(null)}
        onConfirm={() => {
          toggleListenEvent()
        }}
      >
        <p className="text-sm text-foreground-light">
          Are you sure you want to {toggleListenEventValue?.currentStatus ? 'stop' : 'start'}{' '}
          sending {toggleListenEventValue?.event.event.toLowerCase()} events for{' '}
          {toggleListenEventValue?.publication.name}?
        </p>
      </ConfirmationModal>
    </>
  )
}

export default SinglePublicationView
