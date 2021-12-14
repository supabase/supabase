import { FC, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { Button, Input, Toggle, IconSearch } from '@supabase/ui'

import { useStore } from 'hooks'
import { confirmAlert } from 'components/to-be-cleaned/ModalsDeprecated/ConfirmModal'
import Table from 'components/to-be-cleaned/Table'

interface Props {
  onSelectPublication: (publication: any) => void
}

const PublicationsList: FC<Props> = ({ onSelectPublication = () => {} }) => {
  const { ui, meta } = useStore()
  const [filterString, setFilterString] = useState<string>('')

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
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div>
              <Input
                size="tiny"
                icon={<IconSearch size="tiny" />}
                placeholder={'Filter'}
                value={filterString}
                onChange={(e) => setFilterString(e.target.value)}
              />
            </div>
          </div>
          <div className=""></div>
        </div>
      </div>
      <div className="rounded overflow-hidden">
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
              <Table.td>
                <div className="flex justify-center">
                  <Toggle
                    size="tiny"
                    checked={x.publish_insert}
                    onChange={() => toggleListenEvent(x, 'insert', x.publish_insert)}
                  />
                </div>
              </Table.td>
              <Table.td>
                <div className="flex justify-center">
                  <Toggle
                    size="tiny"
                    checked={x.publish_update}
                    onChange={() => toggleListenEvent(x, 'update', x.publish_update)}
                  />
                </div>
              </Table.td>
              <Table.td>
                <div className="flex justify-center">
                  <Toggle
                    size="tiny"
                    checked={x.publish_delete}
                    onChange={() => toggleListenEvent(x, 'delete', x.publish_delete)}
                  />
                </div>
              </Table.td>
              <Table.td>
                <div className="flex justify-center">
                  <Toggle
                    size="tiny"
                    checked={x.publish_truncate}
                    onChange={() => toggleListenEvent(x, 'truncate', x.publish_truncate)}
                  />
                </div>
              </Table.td>
              <Table.td className="px-4 py-3 pr-2">
                <div className="flex gap-2 justify-end">
                  <Button
                    type="default"
                    style={{ paddingTop: 3, paddingBottom: 3 }}
                    onClick={() => onSelectPublication(x)}
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
    </>
  )
}

export default observer(PublicationsList)
