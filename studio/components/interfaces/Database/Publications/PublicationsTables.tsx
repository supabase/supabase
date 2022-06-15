import { FC, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { Button, Toggle, Input, IconChevronLeft, IconSearch } from '@supabase/ui'

import { useStore } from 'hooks'
import PublicationsTableItem from './PublicationsTableItem'
import Table from 'components/to-be-cleaned/Table'
// import { confirmAlert } from 'components/to-be-cleaned/ModalsDeprecated/ConfirmModal'

interface Props {
  selectedPublication: any
  onSelectBack: () => void
  onPublicationUpdated: (publication: any) => void
}

const PublicationsTables: FC<Props> = ({
  selectedPublication,
  onSelectBack,
  // onPublicationUpdated,
}) => {
  const {
    // ui,
    meta,
  } = useStore()
  const [filterString, setFilterString] = useState<string>('')

  const tables =
    filterString.length === 0
      ? meta.tables.list((table: any) => !meta.excludedSchemas.includes(table.schema))
      : meta.tables.list(
          (table: any) =>
            !meta.excludedSchemas.includes(table.schema) && table.name.includes(filterString)
        )

  // const publication = selectedPublication
  // const enabledForAllTables = publication.tables == null

  // const toggleReplicationForAllTables = async (publication: any, disable: boolean) => {
  //   const toggle = disable ? 'disable' : 'enable'
  //   confirmAlert({
  //     title: 'Confirm',
  //     type: 'warn',
  //     message: `Are you sure you want to ${toggle} replication for all tables in ${publication.name}?`,
  //     onAsyncConfirm: async () => {
  //       try {
  //         const res: any = await meta.publications.recreate(publication.id)
  //         if (res.error) {
  //           throw res.error
  //         } else {
  //           onPublicationUpdated(res)
  //         }
  //       } catch (error: any) {
  //         ui.setNotification({
  //           category: 'error',
  //           message: `Failed to toggle replication for all tables: ${error.message}`,
  //         })
  //       }
  //     },
  //   })
  // }

  return (
    <>
      <div className="mb-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Button
              type="outline"
              onClick={() => onSelectBack()}
              icon={<IconChevronLeft />}
              style={{ padding: '5px' }}
            />
            <div>
              <Input
                size="small"
                placeholder={'Filter'}
                value={filterString}
                onChange={(e) => setFilterString(e.target.value)}
                icon={<IconSearch size="tiny" />}
              />
            </div>
          </div>
          <div className=""></div>
        </div>
      </div>
      <div>
        <Table
          head={[
            <Table.th key="header-name">Name</Table.th>,
            <Table.th key="header-schema">Schema</Table.th>,
            <Table.th key="header-desc" className="text-left hidden lg:table-cell">
              Description
            </Table.th>,
            <Table.th key="header-all">
              {/* Temporarily disable All tables toggle for publications. See https://github.com/supabase/supabase/pull/7233.
              <div className="flex flex-row space-x-3 items-center justify-end">
                <div className="text-xs leading-4 font-medium text-gray-400 text-right ">
                  All Tables
                </div>
                <Toggle
                  size="tiny"
                  align="right"
                  error=""
                  className="m-0 p-0 ml-2 mt-1 -mb-1"
                  checked={enabledForAllTables}
                  onChange={() => toggleReplicationForAllTables(publication, enabledForAllTables)}
                />
              </div> */}
            </Table.th>,
          ]}
          body={tables.map((table: any, i: number) => (
            <PublicationsTableItem
              key={table.id}
              table={table}
              selectedPublication={selectedPublication}
            />
          ))}
        />
      </div>
    </>
  )
}

export default observer(PublicationsTables)
