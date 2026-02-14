import { useParams } from 'common'
import AlertError from 'components/ui/AlertError'
import CodeEditor from 'components/ui/CodeEditor/CodeEditor'
import SchemaSelector from 'components/ui/SchemaSelector'
import { useDatabaseIndexDeleteMutation } from 'data/database-indexes/index-delete-mutation'
import { useIndexesQuery, type DatabaseIndex } from 'data/database-indexes/indexes-query'
import { useSchemasQuery } from 'data/database/schemas-query'
import { useQuerySchemaState } from 'hooks/misc/useSchemaQueryState'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useIsProtectedSchema } from 'hooks/useProtectedSchemas'
import { sortBy } from 'lodash'
import { AlertCircle, Search, Trash } from 'lucide-react'
import { parseAsBoolean, parseAsString, useQueryState } from 'nuqs'
import { useEffect } from 'react'
import { toast } from 'sonner'
import {
  Button,
  Card,
  SidePanel,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import { ConfirmationModal } from 'ui-patterns/Dialogs/ConfirmationModal'
import { GenericSkeletonLoader, ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { ProtectedSchemaWarning } from '../ProtectedSchemaWarning'
import { CreateIndexSidePanel } from './CreateIndexSidePanel'

const Indexes = () => {
  const { data: project } = useSelectedProjectQuery()
  const { schema: urlSchema, table } = useParams()

  const [search, setSearch] = useQueryState('search', parseAsString.withDefault(''))
  const { selectedSchema, setSelectedSchema } = useQuerySchemaState()

  const {
    data: allIndexes,
    error: indexesError,
    isPending: isLoadingIndexes,
    isSuccess: isSuccessIndexes,
    isError: isErrorIndexes,
  } = useIndexesQuery({
    schema: selectedSchema,
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const [showCreateIndex, setShowCreateIndex] = useQueryState(
    'new',
    parseAsBoolean.withDefault(false)
  )

  const [editIndexId, setEditIndexId] = useQueryState('edit', parseAsString)
  const selectedIndex = allIndexes?.find((idx) => idx.name === editIndexId)

  const [deleteIndexId, setDeleteIndexId] = useQueryState('delete', parseAsString)
  const selectedIndexToDelete = allIndexes?.find((idx) => idx.name === deleteIndexId)

  const {
    data: schemas,
    isPending: isLoadingSchemas,
    isSuccess: isSuccessSchemas,
    isError: isErrorSchemas,
  } = useSchemasQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const {
    mutate: deleteIndex,
    isPending: isExecuting,
    isSuccess: isSuccessDelete,
  } = useDatabaseIndexDeleteMutation({
    onSuccess: async () => {
      setDeleteIndexId(null)
      toast.success('Successfully deleted index')
    },
  })

  const { isSchemaLocked } = useIsProtectedSchema({ schema: selectedSchema })

  const sortedIndexes = sortBy(allIndexes ?? [], (index) => index.name.toLocaleLowerCase())
  const indexes =
    search.length > 0
      ? sortedIndexes.filter((index) => index.name.includes(search) || index.table.includes(search))
      : sortedIndexes

  const onConfirmDeleteIndex = (index: DatabaseIndex) => {
    if (!project) return console.error('Project is required')
    deleteIndex({
      projectRef: project.ref,
      connectionString: project.connectionString,
      name: index.name,
      schema: selectedSchema,
    })
  }

  useEffect(() => {
    if (urlSchema !== undefined) {
      const schema = schemas?.find((s) => s.name === urlSchema)
      if (schema !== undefined) setSelectedSchema(schema.name)
    }
  }, [urlSchema, isSuccessSchemas])

  useEffect(() => {
    if (table !== undefined) setSearch(table)
  }, [table])

  useEffect(() => {
    if (isSuccessIndexes && !!editIndexId && !selectedIndex) {
      toast('Index not found')
      setEditIndexId(null)
    }
  }, [isSuccessIndexes, editIndexId, selectedIndex, setEditIndexId])

  useEffect(() => {
    if (isSuccessIndexes && !!deleteIndexId && !selectedIndexToDelete && !isSuccessDelete) {
      toast('Index not found')
      setDeleteIndexId(null)
    }
  }, [isSuccessIndexes, deleteIndexId, selectedIndexToDelete, isSuccessDelete, setDeleteIndexId])

  return (
    <>
      <div className="pb-8">
        <div className="flex flex-col gap-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            {isLoadingSchemas && <ShimmeringLoader className="w-[260px]" />}
            {isErrorSchemas && (
              <div className="w-[260px] text-foreground-light text-sm border px-3 py-1.5 rounded flex items-center space-x-2">
                <AlertCircle strokeWidth={2} size={16} />
                <p>Failed to load schemas</p>
              </div>
            )}
            {isSuccessSchemas && (
              <SchemaSelector
                className="w-full lg:w-[180px]"
                size="tiny"
                showError={false}
                selectedSchemaName={selectedSchema}
                onSelectSchema={setSelectedSchema}
              />
            )}
            <Input
              size="tiny"
              value={search}
              className="w-full lg:w-52"
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search for an index"
              icon={<Search />}
            />

            {!isSchemaLocked && (
              <Button
                className="ml-auto flex-grow lg:flex-grow-0"
                type="primary"
                onClick={() => setShowCreateIndex(true)}
                disabled={!isSuccessSchemas}
              >
                Create index
              </Button>
            )}
          </div>

          {isSchemaLocked && <ProtectedSchemaWarning schema={selectedSchema} entity="indexes" />}

          {isLoadingIndexes && <GenericSkeletonLoader />}

          {isErrorIndexes && (
            <AlertError error={indexesError as any} subject="Failed to retrieve database indexes" />
          )}

          {isSuccessIndexes && (
            <div className="w-full overflow-hidden">
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead key="table">Table</TableHead>
                      <TableHead key="columns">Columns</TableHead>
                      <TableHead key="name">Name</TableHead>
                      <TableHead key="buttons" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {indexes.length === 0 && search.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4}>
                          <p className="text-sm text-foreground">No indexes created yet</p>
                          <p className="text-sm text-foreground-light">
                            There are no indexes found in the schema "{selectedSchema}"
                          </p>
                        </TableCell>
                      </TableRow>
                    )}
                    {indexes.length === 0 && search.length > 0 && (
                      <TableRow>
                        <TableCell colSpan={4}>
                          <p className="text-sm text-foreground">No results found</p>
                          <p className="text-sm text-foreground-light">
                            Your search for "{search}" did not return any results
                          </p>
                        </TableCell>
                      </TableRow>
                    )}
                    {indexes.length > 0 &&
                      indexes.map((index) => (
                        <TableRow key={index.name}>
                          <TableCell>
                            <p title={index.table}>{index.table}</p>
                          </TableCell>
                          <TableCell>
                            <p title={index.columns}>{index.columns}</p>
                          </TableCell>
                          <TableCell>
                            <p title={index.name}>{index.name}</p>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end items-center space-x-2">
                              <Button type="default" onClick={() => setEditIndexId(index.name)}>
                                View definition
                              </Button>
                              {!isSchemaLocked && (
                                <Button
                                  aria-label="Delete index"
                                  type="text"
                                  className="px-1"
                                  icon={<Trash />}
                                  onClick={() => setDeleteIndexId(index.name)}
                                />
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </Card>
            </div>
          )}
        </div>
      </div>

      <SidePanel
        size="xlarge"
        visible={!!selectedIndex}
        header={
          <>
            <span>Index:</span>
            <code className="text-sm ml-2">{selectedIndex?.name}</code>
          </>
        }
        onCancel={() => setEditIndexId(null)}
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
        variant="warning"
        size="medium"
        loading={isExecuting}
        visible={!!selectedIndexToDelete}
        title={
          <>
            Confirm to delete index <code className="text-sm">{selectedIndexToDelete?.name}</code>
          </>
        }
        confirmLabel="Confirm delete"
        confirmLabelLoading="Deleting..."
        onConfirm={() =>
          selectedIndexToDelete !== undefined ? onConfirmDeleteIndex(selectedIndexToDelete) : {}
        }
        onCancel={() => setDeleteIndexId(null)}
        alert={{
          title: 'This action cannot be undone',
          description:
            'Deleting an index that is still in use will cause queries to slow down, and in some cases causing significant performance issues.',
        }}
      >
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
      </ConfirmationModal>
    </>
  )
}

export default Indexes
