import { FC, useEffect, useState } from 'react'
import { includes, uniqBy, map as lodashMap } from 'lodash'
import {
  Typography,
  Badge,
  Button,
  Dropdown,
  IconMoreVertical,
  IconTrash,
  Input,
  IconSearch,
  IconEdit3,
  IconLoader,
} from '@supabase/ui'
import { observer } from 'mobx-react-lite'

import { useStore, withAuth } from 'hooks'
import { DatabaseLayout } from 'components/layouts'
import Table from 'components/to-be-cleaned/Table'
import AlphaPreview from 'components/to-be-cleaned/AlphaPreview'
import ProductEmptyState from 'components/to-be-cleaned/ProductEmptyState'
import { CreateTrigger, DeleteTrigger } from 'components/interfaces/Database'

const TriggersPage: FC<any> = () => {
  const { meta } = useStore()

  const [filterString, setFilterString] = useState<string>('')
  const [selectedTrigger, setSelectedTrigger] = useState<any>()
  const [showCreateTriggerForm, setShowCreateTriggerForm] = useState<boolean>(false)
  const [showDeleteTriggerForm, setShowDeleteTriggerForm] = useState<boolean>(false)

  useEffect(() => {
    fetchTriggers()
  }, [])

  const fetchTriggers = async () => {
    await meta.triggers.load()
  }

  const createTrigger = () => {
    setSelectedTrigger(undefined)
    setShowCreateTriggerForm(true)
  }

  const editTrigger = (trigger: any) => {
    setSelectedTrigger(trigger)
    setShowCreateTriggerForm(true)
  }

  const deleteTrigger = (trigger: any) => {
    setSelectedTrigger(trigger)
    setShowDeleteTriggerForm(true)
  }

  return (
    <DatabaseLayout title="Database">
      <TriggersList
        filterString={filterString}
        setFilterString={setFilterString}
        createTrigger={createTrigger}
        editTrigger={editTrigger}
        deleteTrigger={deleteTrigger}
      />
      <CreateTrigger
        trigger={selectedTrigger}
        visible={showCreateTriggerForm}
        setVisible={setShowCreateTriggerForm}
      />
      <DeleteTrigger
        trigger={selectedTrigger}
        visible={showDeleteTriggerForm}
        setVisible={setShowDeleteTriggerForm}
      />
    </DatabaseLayout>
  )
}

export default withAuth(observer(TriggersPage))

const TriggersList: FC<any> = observer(
  ({
    filterString,
    setFilterString = () => {},
    createTrigger = () => {},
    editTrigger = () => {},
    deleteTrigger = () => {},
  }) => {
    const { meta } = useStore()
    const triggers = meta.triggers.list()
    const filteredTriggers = triggers.filter((x: any) =>
      includes(x.name.toLowerCase(), filterString.toLowerCase())
    )
    const filteredTriggerSchemas = lodashMap(uniqBy(filteredTriggers, 'schema'), 'schema')

    if (meta.triggers.isLoading) {
      return (
        <div className="w-full h-full flex items-center justify-center space-x-2">
          <IconLoader className="animate-spin" size={14} />
          <Typography.Text>Loading triggers...</Typography.Text>
        </div>
      )
    }

    if (meta.triggers.hasError) {
      return (
        <Typography.Text className="px-6 py-4" type="danger">
          <p>Error connecting to API</p>
          <p>{`${meta.triggers.error?.message ?? 'Unknown error'}`}</p>
        </Typography.Text>
      )
    }

    return (
      <>
        {triggers.length == 0 ? (
          <div className="flex h-full w-full items-center justify-center">
            <ProductEmptyState
              title="Triggers"
              ctaButtonLabel="Create a new trigger"
              onClickCta={() => createTrigger()}
            >
              <AlphaPreview />
              <Typography.Text type="secondary">
                A PostgreSQL trigger is a function invoked automatically whenever an event
                associated with a table occurs.
              </Typography.Text>
              <Typography.Text type="secondary">
                An event could be any of the following: INSERT, UPDATE, DELETE. A trigger is a
                special user-defined function associated with a table.
              </Typography.Text>
            </ProductEmptyState>
          </div>
        ) : (
          <div className="w-full py-4 space-y-4">
            <div className="flex justify-between items-center px-6">
              <Input
                placeholder="Filter by name"
                size="tiny"
                icon={<IconSearch size="tiny" />}
                value={filterString}
                onChange={(e) => setFilterString(e.target.value)}
              />
              <Button onClick={() => createTrigger()}>Create a new trigger</Button>
            </div>
            {filteredTriggers.length <= 0 && (
              <div className="border dark:border-dark rounded p-6 max-w-lg mx-auto flex justify-center space-x-3 items-center shadow-md">
                <Typography.Text>No results match your filter query</Typography.Text>
                <Button type="outline" onClick={() => setFilterString('')}>
                  Reset filter
                </Button>
              </div>
            )}
            {filteredTriggerSchemas.map((schema: any) => (
              <SchemaTable
                key={schema}
                filterString={filterString}
                schema={schema}
                editTrigger={editTrigger}
                deleteTrigger={deleteTrigger}
              />
            ))}
          </div>
        )}
      </>
    )
  }
)

type SchemaTableProps = {
  filterString: string
  schema: string
  editTrigger: (trigger: any) => void
  deleteTrigger: (trigger: any) => void
}

const SchemaTable: FC<SchemaTableProps> = observer(
  ({ filterString, schema, editTrigger, deleteTrigger }) => {
    return (
      <div key={schema} className="">
        <div className="z-10 sticky top-0 backdrop-filter backdrop-blur">
          <div className="flex space-x-1 items-baseline py-2 px-6">
            <Typography.Title level={5} className="opacity-50">
              schema
            </Typography.Title>
            <Typography.Title level={4}>{schema}</Typography.Title>
          </div>
        </div>
        <Table
          className="table-fixed px-6"
          head={
            <>
              <Table.th key="name" className="space-x-4">
                Name
              </Table.th>
              <Table.th key="table" className="hidden lg:table-cell">
                Table
              </Table.th>
              <Table.th key="function" className="hidden xl:table-cell">
                Function
              </Table.th>
              <Table.th key="rows" className="hidden xl:table-cell">
                Events
              </Table.th>
              <Table.th key="buttons" className="w-1/6"></Table.th>
            </>
          }
          body={
            <TriggerList
              filterString={filterString}
              schema={schema}
              editTrigger={editTrigger}
              deleteTrigger={deleteTrigger}
            />
          }
        />
      </div>
    )
  }
)

type TriggerListProps = {
  filterString: string
  schema: string
  editTrigger: (trigger: any) => void
  deleteTrigger: (trigger: any) => void
}

const TriggerList: FC<TriggerListProps> = observer(
  ({ filterString, schema, editTrigger, deleteTrigger }) => {
    const { meta } = useStore()
    const triggers = meta.triggers.list()
    const filteredTriggers = triggers.filter((x: any) =>
      includes(x.name.toLowerCase(), filterString.toLowerCase())
    )

    const _triggers = filteredTriggers.filter((x: any) => x.schema == schema)

    function onEdit(trigger: any) {
      editTrigger(trigger)
    }

    function onDelete(trigger: any) {
      deleteTrigger(trigger)
    }

    return (
      <>
        {_triggers.map((x: any) => (
          <Table.tr key={x.id}>
            <Table.td className="space-x-2">
              <Typography.Text>{x.name}</Typography.Text>
            </Table.td>
            <Table.td className="hidden lg:table-cell">
              <Typography.Text>{x.table}</Typography.Text>
            </Table.td>
            <Table.td className="space-x-2 hidden xl:table-cell">
              <div className="flex flex-col">
                <Typography.Text>{x.function_name}</Typography.Text>
                <Typography.Text type="secondary">{x.function_schema}</Typography.Text>
              </div>
            </Table.td>
            <Table.td className="hidden xl:table-cell">
              <Typography.Text>
                {x.events.map((event: string) => (
                  <Badge key={event}>{event}</Badge>
                ))}
              </Typography.Text>
            </Table.td>
            <Table.td className="text-right">
              <Dropdown
                side="bottom"
                align="end"
                overlay={
                  <>
                    <Dropdown.Item icon={<IconEdit3 size="tiny" />} onClick={() => onEdit(x)}>
                      Edit trigger
                    </Dropdown.Item>
                    <Dropdown.Item
                      icon={<IconTrash stroke="red" size="tiny" />}
                      onClick={() => onDelete(x)}
                    >
                      Delete trigger
                    </Dropdown.Item>
                  </>
                }
              >
                <Button as="span" type="default" icon={<IconMoreVertical />} />
              </Dropdown>
            </Table.td>
          </Table.tr>
        ))}
      </>
    )
  }
)
