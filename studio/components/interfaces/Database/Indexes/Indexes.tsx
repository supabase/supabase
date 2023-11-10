import { observer } from 'mobx-react-lite'
import Link from 'next/link'
import { useState } from 'react'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  IconAlertCircle,
  IconAlertTriangle,
  IconExternalLink,
  IconSearch,
  IconTrash,
  Input,
  Listbox,
  Modal,
  SidePanel,
} from 'ui'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import Table from 'components/to-be-cleaned/Table'
import AlertError from 'components/ui/AlertError'
import CodeEditor from 'components/ui/CodeEditor'
import ConfirmationModal from 'components/ui/ConfirmationModal'
import ShimmeringLoader, { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { DatabaseIndex, useIndexesQuery } from 'data/database/indexes-query'
import { useSchemasQuery } from 'data/database/schemas-query'
import { useExecuteSqlMutation } from 'data/sql/execute-sql-mutation'
import { useStore } from 'hooks'
import CreateIndexSidePanel from './CreateIndexSidePanel'
import SchemaSelector from 'components/ui/SchemaSelector'
import { partition } from 'lodash'
import { EXCLUDED_SCHEMAS } from 'lib/constants/schemas'
import ProtectedSchemaWarning from '../ProtectedSchemaWarning'

const Indexes = () => {
  const { ui } = useStore()
  const [search, setSearch] = useState('')
  const [selectedSchema, setSelectedSchema] = useState('public')
  const [showCreateIndex, setShowCreateIndex] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState<DatabaseIndex>()
  const [selectedIndexToDelete, setSelectedIndexToDelete] = useState<DatabaseIndex>()

  const { project } = useProjectContext()
  const {
    data: allIndexes,
    refetch: refetchIndexes,
    error: indexesError,
    isLoading: isLoadingIndexes,
    isSuccess: isSuccessIndexes,
    isError: isErrorIndexes,
  } = useIndexesQuery({
    schema: selectedSchema,
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const {
    data: schemas,
    isLoading: isLoadingSchemas,
    isSuccess: isSuccessSchemas,
    isError: isErrorSchemas,
  } = useSchemasQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const { mutate: execute, isLoading: isExecuting } = useExecuteSqlMutation({
    onSuccess() {
      refetchIndexes()
      setSelectedIndexToDelete(undefined)
      ui.setNotification({ category: 'success', message: `Successfully deleted index` })
    },
    onError(error) {
      ui.setNotification({
        error,
        category: 'error',
        message: `Failed to delete index: ${error.message}`,
      })
    },
  })

  const [protectedSchemas] = partition(schemas ?? [], (schema) =>
    EXCLUDED_SCHEMAS.includes(schema?.name ?? '')
  )
  const schema = schemas?.find((schema) => schema.name === selectedSchema)
  const isLocked = protectedSchemas.some((s) => s.id === schema?.id)

  const sortedIndexes = (allIndexes?.result ?? []).sort(
    (a, b) => a.table.localeCompare(b.table) || a.name.localeCompare(b.name)
  )
  const indexes =
    search.length > 0
      ? sortedIndexes.filter((index) => index.name.includes(search) || index.table.includes(search))
      : sortedIndexes

  const onConfirmDeleteIndex = (index: DatabaseIndex) => {
    if (!project) return console.error('Project is required')
    execute({
      projectRef: project.ref,
      connectionString: project.connectionString,
      sql: `drop index if exists "${index.name}"`,
    })
  }

  return (
    <>
      <div className="pb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-1">
            <h3 className="text-xl text-foreground">Database Indexes</h3>
            <div className="text-sm text-foreground-lighter">
              Improve query performance against your database
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button asChild type="default" icon={<IconExternalLink strokeWidth={1.5} />}>
              <Link
                href="https://supabase.com/docs/guides/database/query-optimization"
                target="_blank"
                rel="noreferrer"
              >
                Documentation
              </Link>
            </Button>
            <Button asChild type="default" icon={<IconExternalLink strokeWidth={1.5} />}>
              <Link
                href="https://supabase.com/docs/guides/database/extensions/index_advisor"
                target="_blank"
                rel="noreferrer"
              >
                Optimization with index_advisor
              </Link>
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {isLoadingSchemas && <ShimmeringLoader className="w-[260px]" />}
              {isErrorSchemas && (
                <div className="w-[260px] text-foreground-light text-sm border px-3 py-1.5 rounded flex items-center space-x-2">
                  <IconAlertCircle strokeWidth={2} size={16} />
                  <p>Failed to load schemas</p>
                </div>
              )}
              {isSuccessSchemas && (
                <SchemaSelector
                  className="w-[260px]"
                  size="small"
                  showError={false}
                  selectedSchemaName={selectedSchema}
                  onSelectSchema={setSelectedSchema}
                />
              )}
              <Input
                size="small"
                value={search}
                className="w-64"
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search for an index"
                icon={<IconSearch size={14} />}
              />
            </div>
            {!isLocked && (
              <Button
                type="primary"
                onClick={() => setShowCreateIndex(true)}
                disabled={!isSuccessSchemas}
              >
                Create index
              </Button>
            )}
          </div>

          {isLocked && <ProtectedSchemaWarning schema={selectedSchema} entity="indexes" />}

          {isLoadingIndexes && <GenericSkeletonLoader />}

          {isErrorIndexes && (
            <AlertError error={indexesError as any} subject="Failed to retrieve database indexes" />
          )}

          {isSuccessIndexes && (
            <Table
              head={[
                <Table.th key="schema">Schema</Table.th>,
                <Table.th key="table">Table</Table.th>,
                <Table.th key="name">Name</Table.th>,
                <Table.th key="buttons"></Table.th>,
              ]}
              body={
                <>
                  {sortedIndexes.length === 0 && search.length === 0 && (
                    <Table.tr>
                      <Table.td colSpan={4}>
                        <p className="text-sm text-foreground">No indexes created yet</p>
                        <p className="text-sm text-foreground-light">
                          There are no indexes found in the schema "{selectedSchema}"
                        </p>
                      </Table.td>
                    </Table.tr>
                  )}
                  {sortedIndexes.length === 0 && search.length > 0 && (
                    <Table.tr>
                      <Table.td colSpan={4}>
                        <p className="text-sm text-foreground">No results found</p>
                        <p className="text-sm text-foreground-light">
                          Your search for "{search}" did not return any results
                        </p>
                      </Table.td>
                    </Table.tr>
                  )}
                  {indexes.length > 0 &&
                    indexes.map((index) => (
                      <Table.tr key={index.name}>
                        <Table.td>
                          <p title={index.schema}>{index.schema}</p>
                        </Table.td>
                        <Table.td>
                          <p title={index.table}>{index.table}</p>
                        </Table.td>
                        <Table.td>
                          <p title={index.name}>{index.name}</p>
                        </Table.td>
                        <Table.td>
                          <div className="flex justify-end items-center space-x-2">
                            <Button type="default" onClick={() => setSelectedIndex(index)}>
                              View definition
                            </Button>
                            {!isLocked && (
                              <Button
                                type="text"
                                className="px-1"
                                icon={<IconTrash />}
                                onClick={() => setSelectedIndexToDelete(index)}
                              />
                            )}
                          </div>
                        </Table.td>
                      </Table.tr>
                    ))}
                </>
              }
            />
          )}
        </div>
      </div>

      <SidePanel
        size="xlarge"
        visible={selectedIndex !== undefined}
        header={
          <>
            <span>Index:</span>
            <code className="text-sm ml-2">{selectedIndex?.name}</code>
          </>
        }
        onCancel={() => setSelectedIndex(undefined)}
      >
        <div className="h-full">
          <div className="relative h-full">
            <CodeEditor
              isReadOnly
              id={selectedIndex?.name ?? ''}
              language="pgsql"
              defaultValue={selectedIndex?.definition ?? ''}
            />
          </div>
        </div>
      </SidePanel>

      <CreateIndexSidePanel visible={showCreateIndex} onClose={() => setShowCreateIndex(false)} />

      <ConfirmationModal
        danger
        size="medium"
        loading={isExecuting}
        visible={selectedIndexToDelete !== undefined}
        header={
          <>
            Confirm to delete index <code className="text-sm">{selectedIndexToDelete?.name}</code>
          </>
        }
        buttonLabel="Confirm delete"
        buttonLoadingLabel="Deleting..."
        onSelectConfirm={() =>
          selectedIndexToDelete !== undefined ? onConfirmDeleteIndex(selectedIndexToDelete) : {}
        }
        onSelectCancel={() => setSelectedIndexToDelete(undefined)}
      >
        <Modal.Content>
          <div className="py-6">
            <Alert_Shadcn_ variant="warning">
              <IconAlertTriangle strokeWidth={2} />
              <AlertTitle_Shadcn_>This action cannot be undone</AlertTitle_Shadcn_>
              <AlertDescription_Shadcn_>
                Deleting an index that is still in use will cause queries to slow down, and in some
                cases causing significant performance issues.
              </AlertDescription_Shadcn_>
            </Alert_Shadcn_>
            <ul className="mt-4 space-y-5">
              <li className="flex gap-3">
                <div>
                  <strong className="text-sm">Before deleting this index, consider:</strong>
                  <ul className="space-y-2 mt-2 text-sm text-foreground-light">
                    <li className="list-disc ml-6">This index is no longer in use</li>
                    <li className="list-disc ml-6">
                      The table which the index is on is not currently in use, as dropping an index
                      requires a short exclusive access lock on the table.
                    </li>
                  </ul>
                </div>
              </li>
            </ul>
          </div>
        </Modal.Content>
      </ConfirmationModal>
    </>
  )
}

export default observer(Indexes)
