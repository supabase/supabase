import { FC, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Button, Input, Toggle, IconSearch, IconAlertCircle } from 'ui'

import { checkPermissions, useStore } from 'hooks'
import { confirmAlert } from 'components/to-be-cleaned/ModalsDeprecated/ConfirmModal'
import Table from 'components/to-be-cleaned/Table'
import NoSearchResults from 'components/to-be-cleaned/NoSearchResults'
import InformationBox from 'components/ui/InformationBox'

interface Props {
  onSelectPublication: (id: number) => void
}

const PublicationsList: FC<Props> = ({ onSelectPublication = () => {} }) => {
  const { ui, meta } = useStore()
  const [filterString, setFilterString] = useState<string>('')

  const canUpdatePublications = checkPermissions(
    PermissionAction.TENANT_SQL_ADMIN_WRITE,
    'publications'
  )

  const publicationEvents = [
    { event: 'Insert', key: 'publish_insert' },
    { event: 'Update', key: 'publish_update' },
    { event: 'Delete', key: 'publish_delete' },
    { event: 'Truncate', key: 'publish_truncate' },
  ]
  const publications =
    filterString.length === 0
      ? meta.publications.list()
      : meta.publications.list((publication: any) => publication.name.includes(filterString))

  const toggleListenEvent = async (publication: any, event: any, currentStatus: any) => {
    const startStop = currentStatus ? 'stop' : 'start'
    confirmAlert({
      title: 'Confirm',
      message: `Are you sure you want to ${startStop} sending ${event} events for ${publication.name}?`,
      onAsyncConfirm: async () => {
        try {
          let payload: any = { id: publication.id }
          payload[`publish_${event}`] = !currentStatus
          const { data, error }: any = await meta.publications.update(publication.id, payload)
          if (error) {
            throw error
          } else {
            return data
          }
        } catch (error: any) {
          ui.setNotification({
            category: 'error',
            message: `Failed to toggle for ${publication.name}: ${error.message}`,
          })
          return false
        }
      },
    })
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
                icon={<IconAlertCircle className="text-scale-1100" strokeWidth={2} />}
                title="You need additional permissions to update database replications"
              />
            </div>
          )}
        </div>
      </div>
      {publications.length === 0 ? (
        <NoSearchResults />
      ) : (
        <div className="overflow-hidden rounded">
          <Table
            head={[
              <Table.th key="header.name">Name</Table.th>,
              <Table.th key="header.id" className="hidden lg:table-cell">
                System ID
              </Table.th>,
              <Table.th key="header.insert" className="text-center">
                Insert
              </Table.th>,
              <Table.th key="header.update" className="text-center">
                Update
              </Table.th>,
              <Table.th key="header.delete" className="text-center">
                Delete
              </Table.th>,
              <Table.th key="header.truncate" className="text-center">
                Truncate
              </Table.th>,
              <Table.th key="header.source" className="text-right">
                Source
              </Table.th>,
            ]}
            body={publications.map((x: any, i: number) => (
              <Table.tr className="border-t " key={x.name}>
                <Table.td className="px-4 py-3" style={{ width: '25%' }}>
                  {x.name}
                </Table.td>
                <Table.td className="hidden lg:table-cell" style={{ width: '25%' }}>
                  {x.id}
                </Table.td>
                {publicationEvents.map((event) => (
                  <Table.td key={event.key}>
                    <div className="flex justify-center">
                      <Toggle
                        size="tiny"
                        checked={x[event.key]}
                        disabled={!canUpdatePublications}
                        onChange={() =>
                          toggleListenEvent(x, event.event.toLowerCase(), x[event.key])
                        }
                      />
                    </div>
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
    </>
  )
}

export default observer(PublicationsList)
