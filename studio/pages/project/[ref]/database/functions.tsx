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

import { useStore, withAuth } from 'hooks'
import { DatabaseLayout } from 'components/layouts'
import { CreateFunction, DeleteFunction } from 'components/interfaces/Database'
import Table from 'components/to-be-cleaned/Table'
import AlphaPreview from 'components/to-be-cleaned/AlphaPreview'
import ProductEmptyState from 'components/to-be-cleaned/ProductEmptyState'

const FunctionsPage: FC<any> = () => {
  const { meta } = useStore()
  const [filterString, setFilterString] = useState<string>('')
  const [selectedFunction, setSelectedFunction] = useState<any>()
  const [showCreateFunctionForm, setShowCreateFunctionForm] = useState<boolean>(false)
  const [showDeleteFunctionForm, setShowDeleteFunctionForm] = useState<boolean>(false)

  useEffect(() => {
    fetchFunctions()
  }, [])

  const fetchFunctions = async () => {
    await meta.functions.load()
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
    <DatabaseLayout title="Database">
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
    </DatabaseLayout>
  )
}

export default withAuth(observer(FunctionsPage))

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
        <div className="w-full h-full flex items-center justify-center space-x-2">
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
              <Typography.Text type="secondary">
                PostgreSQL functions, also known as stored procedures, is a set of SQL and
                procedural commands such as declarations, assignments, loops, flow-of-control, etc.
              </Typography.Text>
              <Typography.Text type="secondary">
                It's stored on the database server and can be invoked using the SQL interface.
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
              <Button onClick={() => createFunction()}>Create a new function</Button>
            </div>
            {filteredFunctions.length <= 0 && (
              <div className="border dark:border-dark rounded p-6 max-w-lg mx-auto flex justify-center space-x-3 items-center shadow-md">
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
            <Table.td className="hidden md:table-cell">
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
