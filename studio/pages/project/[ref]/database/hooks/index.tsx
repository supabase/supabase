import { FC, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { includes, uniqBy, map as lodashMap } from 'lodash'
import { observer } from 'mobx-react-lite'
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

import { useStore } from 'hooks'
import { API_URL } from 'lib/constants'
import { post } from 'lib/common/fetch'
import { DatabaseLayout } from 'components/layouts'
import Table from 'components/to-be-cleaned/Table'
import AlphaPreview from 'components/to-be-cleaned/AlphaPreview'
import ProductEmptyState from 'components/to-be-cleaned/ProductEmptyState'
import CreateHook from 'components/interfaces/Database/Hooks/CreateHook'
import DeleteHook from 'components/interfaces/Database/Hooks/DeleteHook'
import { NextPageWithLayout } from 'types'

function isHooksEnabled(schemas: any): boolean {
  return schemas.some((schema: any) => schema.name === 'supabase_functions')
}

const HooksPage: NextPageWithLayout = () => {
  const { meta, ui } = useStore()

  const router = useRouter()
  const { ref } = router.query

  const [hooksEnabled, setHooksEnabled] = useState<any>(false)
  const [filterString, setFilterString] = useState<string>('')
  const [selectedHook, setSelectedHook] = useState<any>()
  const [showCreateHookForm, setShowCreateHookForm] = useState<boolean>(false)
  const [showDeleteHookForm, setShowDeleteHookForm] = useState<boolean>(false)

  useEffect(() => {
    if (ui.selectedProject) {
      fetchHooks()
    }
  }, [ui.selectedProject])

  const fetchHooks = async () => {
    meta.hooks.load()
  }

  const enableHooksForProject = async () => {
    const headers: any = {}
    const connectionString = ui.selectedProject?.connectionString
    if (connectionString) headers['x-connection-encrypted'] = connectionString
    try {
      await post(`${API_URL}/database/${ref}/hook-enable`, {})
      setHooksEnabled(true)
    } catch (error) {
      console.error(error)
    }
  }

  const createHook = () => {
    setSelectedHook(undefined)
    setShowCreateHookForm(true)
  }

  const editHook = (hook: any) => {
    setSelectedHook(hook)
    setShowCreateHookForm(true)
  }

  const deleteHook = (hook: any) => {
    setSelectedHook(hook)
    setShowDeleteHookForm(true)
  }

  return (
    <>
      <TriggersList
        hooksEnabled={hooksEnabled}
        filterString={filterString}
        setFilterString={setFilterString}
        createHook={createHook}
        editHook={editHook}
        deleteHook={deleteHook}
        enableHooks={enableHooksForProject}
      />
      <CreateHook
        hook={selectedHook}
        visible={showCreateHookForm}
        setVisible={setShowCreateHookForm}
      />
      <DeleteHook
        hook={selectedHook}
        visible={showDeleteHookForm}
        setVisible={setShowDeleteHookForm}
      />
    </>
  )
}

HooksPage.getLayout = (page) => <DatabaseLayout title="Hooks">{page}</DatabaseLayout>

export default observer(HooksPage)

const TriggersList: FC<any> = observer(
  ({
    hooksEnabled,
    filterString,
    setFilterString = () => {},
    createHook = () => {},
    editHook = () => {},
    deleteHook = () => {},
    enableHooks = () => {},
  }) => {
    const { meta } = useStore()
    const hooks = meta.hooks.list()
    const schemas = meta.schemas.list()
    const filteredHooks = hooks.filter((x: any) =>
      includes(x.name.toLowerCase(), filterString.toLowerCase())
    )
    const filteredHookSchemas = lodashMap(uniqBy(filteredHooks, 'schema'), 'schema')

    const isEnabled = hooksEnabled || isHooksEnabled(schemas)

    if (!isEnabled) {
      return (
        <>
          {schemas.length === 0 ? (
            <span className="text-scale-1100 px-6 py-4">Checking if hooks are enabled...</span>
          ) : (
            <ProductEmptyState
              title="Hooks"
              ctaButtonLabel="Enable Hooks"
              onClickCta={() => enableHooks()}
            >
              <AlphaPreview />
              <p className="text-scale-1100 text-sm">Enable hooks on your project.</p>
            </ProductEmptyState>
          )}
        </>
      )
    }

    if (meta.hooks.isLoading) {
      return (
        <div className="flex h-full w-full items-center justify-center space-x-2">
          <IconLoader className="animate-spin" size={14} />
          <Typography.Text>Loading hooks...</Typography.Text>
        </div>
      )
    }

    if (meta.hooks.hasError) {
      return (
        <Typography.Text className="px-6 py-4" type="danger">
          <p>Error connecting to API</p>
          <p>{`${meta.hooks.error?.message ?? 'Unknown error'}`}</p>
        </Typography.Text>
      )
    }

    return (
      <>
        {hooks.length == 0 ? (
          <div className="flex h-full w-full items-center justify-center">
            <ProductEmptyState
              title="Database Webhooks"
              ctaButtonLabel="Create Webhook"
              onClickCta={() => createHook()}
            >
              <AlphaPreview />
              <p className="text-scale-1100 text-sm">
                Database Webhooks can be used to trigger serverless functions or send requests to an
                HTTP endpoint.
              </p>
            </ProductEmptyState>
          </div>
        ) : (
          <div className="w-full space-y-4 py-4">
            <div className="flex items-center justify-between px-6">
              <Input
                placeholder="Filter by name"
                size="small"
                icon={<IconSearch size="tiny" />}
                value={filterString}
                onChange={(e) => setFilterString(e.target.value)}
              />
              <Button onClick={() => createHook()}>Create a new hook</Button>
            </div>
            {filteredHooks.length <= 0 && (
              <div className="dark:border-dark mx-auto flex max-w-lg items-center justify-center space-x-3 rounded border p-6 shadow-md">
                <Typography.Text>No results match your filter query</Typography.Text>
                <Button type="outline" onClick={() => setFilterString('')}>
                  Reset filter
                </Button>
              </div>
            )}
            {filteredHookSchemas.map((schema: any) => (
              <SchemaTable
                key={schema}
                filterString={filterString}
                schema={schema}
                editHook={editHook}
                deleteHook={deleteHook}
              />
            ))}
          </div>
        )}
      </>
    )
  }
)

type SchemaTableProps = {
  schema: string
  filterString: string
  editHook: (hook: any) => void
  deleteHook: (hook: any) => void
}

const SchemaTable: FC<SchemaTableProps> = observer(
  ({ schema, filterString, editHook = () => {}, deleteHook = () => {} }) => {
    return (
      <div key={schema} className="">
        <div className="sticky top-0 backdrop-blur backdrop-filter">
          <div className="flex items-baseline space-x-1 py-2 px-6">
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
              <Table.th key="events" className="hidden xl:table-cell">
                Events
              </Table.th>
              <Table.th key="webhook" className="hidden xl:table-cell">
                Webhook
              </Table.th>
              <Table.th key="buttons" className="w-1/6"></Table.th>
            </>
          }
          body={
            <HookList
              filterString={filterString}
              schema={schema}
              editHook={editHook}
              deleteHook={deleteHook}
            />
          }
        />
      </div>
    )
  }
)

type HookListProps = {
  schema: string
  filterString: string
  editHook: (hook: any) => void
  deleteHook: (hook: any) => void
}

const HookList: FC<HookListProps> = observer(
  ({ schema, filterString, editHook = () => {}, deleteHook = () => {} }) => {
    const { meta } = useStore()
    const hooks = meta.hooks.list()
    const filteredHooks = hooks.filter((x: any) =>
      includes(x.name.toLowerCase(), filterString.toLowerCase())
    )
    const _hooks = filteredHooks.filter((x: any) => x.schema == schema)

    function onEdit(trigger: any) {
      editHook(trigger)
    }

    function onDelete(trigger: any) {
      deleteHook(trigger)
    }

    return (
      <>
        {_hooks.map((x: any) => (
          <Table.tr key={x.id}>
            <Table.td className="space-x-2">
              <Typography.Text>{x.name}</Typography.Text>
            </Table.td>
            <Table.td className="hidden space-x-2 lg:table-cell">
              <Typography.Text>{x.table}</Typography.Text>
            </Table.td>
            <Table.td className="hidden xl:table-cell">
              <Typography.Text>
                {x.events.map((event: string) => (
                  <Badge key={event}>{event}</Badge>
                ))}
              </Typography.Text>
            </Table.td>
            <Table.td className="hidden xl:table-cell">
              <Typography.Text>
                <Badge>{x.function_args[0]}</Badge>
              </Typography.Text>
            </Table.td>
            <Table.td className="text-right">
              <div className="flex justify-end gap-4">
                {/* <Link href={`/project/${_pageState.project.ref}/database/hooks/${x.id}/logs`}>
                  <Button type="default">Logs</Button>
                </Link> */}
                <Dropdown
                  side="left"
                  overlay={
                    <>
                      <Dropdown.Item icon={<IconEdit3 size="tiny" />} onClick={() => onEdit(x)}>
                        Edit hook
                      </Dropdown.Item>
                      <Dropdown.Item
                        icon={<IconTrash stroke="red" size="tiny" />}
                        onClick={() => onDelete(x)}
                      >
                        Delete hook
                      </Dropdown.Item>
                    </>
                  }
                >
                  <Button as="span" type="default" icon={<IconMoreVertical />} />
                </Dropdown>
              </div>
            </Table.td>
          </Table.tr>
        ))}
      </>
    )
  }
)
