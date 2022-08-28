import { FC, useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { uniqBy, map as lodashMap, includes } from 'lodash'
import {
  Button,
  Dropdown,
  IconEdit3,
  IconFileText,
  IconMoreVertical,
  IconSearch,
  IconTrash,
  IconLoader,
  Input,
  Typography,
} from '@supabase/ui'
import { observer } from 'mobx-react-lite'

import { useStore } from 'hooks'
import { DatabaseLayout } from 'components/layouts'
import { CreateFunction, DeleteFunction } from 'components/interfaces/Database'
import Table from 'components/to-be-cleaned/Table'
import AlphaPreview from 'components/to-be-cleaned/AlphaPreview'
import ProductEmptyState from 'components/to-be-cleaned/ProductEmptyState'
import { NextPageWithLayout } from 'types'

const FunctionsPage: NextPageWithLayout = () => {
  const { meta, ui } = useStore()
  const [filterString, setFilterString] = useState<string>('')
  const [selectedFunction, setSelectedFunction] = useState<any>()
  const [showCreateFunctionForm, setShowCreateFunctionForm] = useState<boolean>(false)
  const [showDeleteFunctionForm, setShowDeleteFunctionForm] = useState<boolean>(false)

  useEffect(() => {
    if (ui.selectedProject) {
      fetchFunctions()
    }
  }, [ui.selectedProject])

  const fetchFunctions = async () => {
    meta.functions.load()
  }

  const createFunction = () => {
    setSelectedFunction(undefined)
    setShowCreateFunctionForm(true)
  }

  const editFunction = (fn: any) => {
    setSelectedFunction(fn)
    setShowCreateFunctionForm(true)
  }

  const deleteFunction = (fn: any) => {
    setSelectedFunction(fn)
    setShowDeleteFunctionForm(true)
  }

  return (
    <>
      <PageLayout
        filterString={filterString}
        setFilterString={setFilterString}
        createFunction={createFunction}
        editFunction={editFunction}
        deleteFunction={deleteFunction}
      />
      <CreateFunction
        func={selectedFunction}
        visible={showCreateFunctionForm}
        setVisible={setShowCreateFunctionForm}
      />
      <DeleteFunction
        func={selectedFunction}
        visible={showDeleteFunctionForm}
        setVisible={setShowDeleteFunctionForm}
      />
    </>
  )
}

FunctionsPage.getLayout = (page) => <DatabaseLayout title="Database">{page}</DatabaseLayout>

export default observer(FunctionsPage)

const PageLayout: FC<any> = observer(
  ({
    filterString,
    setFilterString = () => {},
    createFunction = () => {},
    editFunction = () => {},
    deleteFunction = () => {},
  }) => {
    const { meta } = useStore()
    const functions = meta.functions.list((fn: any) => !meta.excludedSchemas.includes(fn.schema))
    const filteredFunctions = functions.filter((x: any) =>
      includes(x.name.toLowerCase(), filterString.toLowerCase())
    )
    const filteredFunctionSchemas = lodashMap(uniqBy(filteredFunctions, 'schema'), 'schema')

    if (meta.functions.isLoading) {
      return (
        <div className="flex h-full w-full items-center justify-center space-x-2">
          <IconLoader className="animate-spin" size={14} />
          <Typography.Text>Loading functions...</Typography.Text>
        </div>
      )
    }

    if (meta.functions.hasError) {
      return (
        <Typography.Text className="px-6 py-4" type="danger">
          <p>Error connecting to API</p>
          <p>{`${meta.functions.error?.message ?? 'Unknown error'}`}</p>
        </Typography.Text>
      )
    }

    return (
      <>
        {functions.length == 0 ? (
          <div className="flex h-full w-full items-center justify-center">
            <ProductEmptyState
              title="Functions"
              ctaButtonLabel="Create a new function"
              onClickCta={() => createFunction()}
            >
              <AlphaPreview />
              <p className="text-scale-1100 text-sm">
                PostgreSQL functions, also known as stored procedures, is a set of SQL and
                procedural commands such as declarations, assignments, loops, flow-of-control, etc.
              </p>
              <p className="text-scale-1100 text-sm">
                It's stored on the database server and can be invoked using the SQL interface.
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
              <Button onClick={() => createFunction()}>Create a new function</Button>
            </div>
            {filteredFunctions.length <= 0 && (
              <div className="dark:border-dark mx-auto flex max-w-lg items-center justify-center space-x-3 rounded border p-6 shadow-md">
                <Typography.Text>No results match your filter query</Typography.Text>
                <Button type="outline" onClick={() => setFilterString('')}>
                  Reset filter
                </Button>
              </div>
            )}
            {filteredFunctionSchemas.map((schema: any) => (
              <SchemaTable
                key={schema}
                filterString={filterString}
                schema={schema}
                editFunction={editFunction}
                deleteFunction={deleteFunction}
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
  editFunction: (fn: any) => void
  deleteFunction: (fn: any) => void
}

const SchemaTable: FC<SchemaTableProps> = observer(
  ({ schema, filterString, editFunction = () => {}, deleteFunction = () => {} }) => {
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
              <Table.th key="name" className="w-1/3 space-x-4">
                Name
              </Table.th>
              <Table.th key="arguments" className="hidden md:table-cell">
                Arguments
              </Table.th>
              <Table.th key="return_type" className="hidden lg:table-cell">
                Return type
              </Table.th>
              <Table.th key="buttons" className="w-1/6"></Table.th>
            </>
          }
          body={
            <FunctionList
              schema={schema}
              filterString={filterString}
              editFunction={editFunction}
              deleteFunction={deleteFunction}
            />
          }
        />
      </div>
    )
  }
)

type FunctionListProps = {
  schema: string
  filterString: string
  editFunction: (fn: any) => void
  deleteFunction: (fn: any) => void
}

const FunctionList: FC<FunctionListProps> = observer(
  ({ schema, filterString, editFunction = () => {}, deleteFunction = () => {} }) => {
    const router = useRouter()
    const { ui, meta } = useStore()
    const functions = meta.functions.list((fn: any) => !meta.excludedSchemas.includes(fn.schema))
    const filteredFunctions = functions.filter((x: any) =>
      includes(x.name.toLowerCase(), filterString.toLowerCase())
    )
    const _functions = filteredFunctions.filter((x) => x.schema == schema)
    const isApiDocumentAvailable = schema == 'public'
    const projectRef = ui.selectedProject?.ref

    function onEdit(func: any) {
      editFunction(func)
    }

    function onDelete(func: any) {
      deleteFunction(func)
    }

    return (
      <>
        {_functions.map((x) => (
          <Table.tr key={x.id}>
            <Table.td>
              <Typography.Text>{x.name}</Typography.Text>
            </Table.td>
            <Table.td className="hidden md:table-cell md:overflow-auto">
              <Typography.Text>{x.argument_types}</Typography.Text>
            </Table.td>
            <Table.td className="hidden lg:table-cell">
              <Typography.Text>{x.return_type}</Typography.Text>
            </Table.td>
            <Table.td className="text-right">
              <Dropdown
                side="left"
                overlay={
                  <>
                    {isApiDocumentAvailable && (
                      <Dropdown.Item
                        icon={<IconFileText size="tiny" />}
                        onClick={() => router.push(`/project/${projectRef}/api?rpc=${x.name}`)}
                      >
                        Client API docs
                      </Dropdown.Item>
                    )}
                    <Dropdown.Item icon={<IconEdit3 size="tiny" />} onClick={() => onEdit(x)}>
                      Edit function
                    </Dropdown.Item>
                    <Dropdown.Item
                      icon={<IconTrash stroke="red" size="tiny" />}
                      onClick={() => onDelete(x)}
                    >
                      Delete function
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
