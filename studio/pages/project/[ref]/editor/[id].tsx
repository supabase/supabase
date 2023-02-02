import { useEffect, useState } from 'react'
import { NextPage } from 'next'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { observer } from 'mobx-react-lite'
import { isUndefined, isNaN } from 'lodash'
import { Alert, Button, Checkbox, IconExternalLink, Modal } from 'ui'
import type { PostgresTable, PostgresColumn } from '@supabase/postgres-meta'

import { useStore, withAuth, useUrlState, useParams } from 'hooks'
import { Dictionary } from 'components/grid'
import { TableEditorLayout } from 'components/layouts'
import { TableGridEditor } from 'components/interfaces'
import ConfirmationModal from 'components/ui/ConfirmationModal'
import { SchemaView } from 'types'

const TableEditorPage: NextPage = () => {
  const router = useRouter()
  const { id } = useParams()
  const [_, setParams] = useUrlState({ arrayKeys: ['filter', 'sort'] })

  const { meta, ui } = useStore()
  const [selectedSchema, setSelectedSchema] = useState<string>()

  const [isDeleting, setIsDeleting] = useState<boolean>(false)
  const [isDuplicating, setIsDuplicating] = useState<boolean>(false)
  const [isDeleteWithCascade, setIsDeleteWithCascade] = useState(false)

  const [selectedColumnToDelete, setSelectedColumnToDelete] = useState<PostgresColumn>()
  const [selectedTableToDelete, setSelectedTableToDelete] = useState<PostgresTable>()

  const [sidePanelKey, setSidePanelKey] = useState<'row' | 'column' | 'table'>()
  const [selectedRowToEdit, setSelectedRowToEdit] = useState<Dictionary<any>>()
  const [selectedColumnToEdit, setSelectedColumnToEdit] = useState<PostgresColumn>()
  const [selectedTableToEdit, setSelectedTableToEdit] = useState<PostgresTable>()

  const projectRef = ui.selectedProject?.ref
  const tables: PostgresTable[] = meta.tables.list()
  const views: SchemaView[] = meta.views.list()
  const foreignTables: Partial<PostgresTable>[] = meta.foreignTables.list()

  const selectedTable = !isNaN(Number(id))
    ? // @ts-ignore
      tables
        // @ts-ignore
        .concat(views)
        // @ts-ignore
        .concat(foreignTables)
        .find((table) => table.id === Number(id))
    : undefined

  useEffect(() => {
    if (selectedTable && 'schema' in selectedTable) {
      setSelectedSchema(selectedTable.schema)
    }
  }, [selectedTable?.name])

  const onAddRow = () => {
    setSidePanelKey('row')
    setSelectedRowToEdit(undefined)
  }

  const onEditRow = (row: Dictionary<any>) => {
    setSidePanelKey('row')
    setSelectedRowToEdit(row)
  }

  const onAddColumn = () => {
    setSidePanelKey('column')
    setSelectedColumnToEdit(undefined)
  }

  const onEditColumn = (column: PostgresColumn) => {
    setSidePanelKey('column')
    setSelectedColumnToEdit(column)
  }

  const onDeleteColumn = (column: PostgresColumn) => {
    setIsDeleting(true)
    setSelectedColumnToDelete(column)
    setIsDeleteWithCascade(false)
  }

  const onAddTable = () => {
    setSidePanelKey('table')
    setIsDuplicating(false)
    setSelectedTableToEdit(undefined)
  }

  const onEditTable = (table: PostgresTable) => {
    setSidePanelKey('table')
    setIsDuplicating(false)
    setSelectedTableToEdit(table)
  }

  const onDeleteTable = (table: PostgresTable) => {
    setIsDeleting(true)
    setSelectedTableToDelete(table)
    setIsDeleteWithCascade(false)
  }

  const onDuplicateTable = (table: PostgresTable) => {
    setSidePanelKey('table')
    setIsDuplicating(true)
    setSelectedTableToEdit(table)
  }

  const onClosePanel = () => {
    setSidePanelKey(undefined)
  }

  const removeDeletedColumnFromFiltersAndSorts = (columnName: string) => {
    setParams((prevParams) => {
      const existingFilters = (prevParams?.filter ?? []) as string[]
      const existingSorts = (prevParams?.sort ?? []) as string[]

      return {
        ...prevParams,
        filter: existingFilters.filter((filter: string) => {
          const [column] = filter.split(':')
          if (column !== columnName) return filter
        }),
        sort: existingSorts.filter((sort: string) => {
          const [column] = sort.split(':')
          if (column !== columnName) return sort
        }),
      }
    })
  }

  const onConfirmDeleteColumn = async () => {
    try {
      if (selectedColumnToDelete === undefined) return

      const response: any = await meta.columns.del(selectedColumnToDelete.id, isDeleteWithCascade)
      if (response.error) throw response.error

      removeDeletedColumnFromFiltersAndSorts(selectedColumnToDelete.name)

      ui.setNotification({
        category: 'success',
        message: `Successfully deleted column "${selectedColumnToDelete.name}"`,
      })

      await meta.tables.loadById(selectedColumnToDelete!.table_id)
      if (selectedSchema) await meta.views.loadBySchema(selectedSchema)
    } catch (error: any) {
      ui.setNotification({
        category: 'error',
        message: `Failed to delete ${selectedColumnToDelete!.name}: ${error.message}`,
      })
    } finally {
      setIsDeleting(false)
      setSelectedColumnToDelete(undefined)
    }
  }

  const onConfirmDeleteTable = async () => {
    try {
      if (selectedTableToDelete === undefined) return

      const response: any = await meta.tables.del(selectedTableToDelete.id, isDeleteWithCascade)
      if (response.error) throw response.error

      const tables = meta.tables.list((table: PostgresTable) => table.schema === selectedSchema)

      // For simplicity for now, we just open the first table within the same schema
      if (tables.length > 0) {
        router.push(`/project/${projectRef}/editor/${tables[0].id}`)
      } else {
        router.push(`/project/${projectRef}/editor/`)
      }
      ui.setNotification({
        category: 'success',
        message: `Successfully deleted table "${selectedTableToDelete.name}"`,
      })
      if (selectedSchema) await meta.views.loadBySchema(selectedSchema)
    } catch (error: any) {
      ui.setNotification({
        error,
        category: 'error',
        message: `Failed to delete ${selectedTableToDelete?.name}: ${error.message}`,
      })
    } finally {
      setIsDeleting(false)
      setSelectedTableToDelete(undefined)
    }
  }

  return (
    <TableEditorLayout
      selectedSchema={selectedSchema}
      onSelectSchema={setSelectedSchema}
      onAddTable={onAddTable}
      onEditTable={onEditTable}
      onDeleteTable={onDeleteTable}
      onDuplicateTable={onDuplicateTable}
    >
      <TableGridEditor
        selectedSchema={selectedSchema}
        selectedTable={selectedTable}
        sidePanelKey={sidePanelKey}
        isDuplicating={isDuplicating}
        selectedRowToEdit={selectedRowToEdit}
        selectedColumnToEdit={selectedColumnToEdit}
        selectedTableToEdit={selectedTableToEdit}
        onAddRow={onAddRow}
        onEditRow={onEditRow}
        onAddColumn={onAddColumn}
        onEditColumn={onEditColumn}
        onDeleteColumn={onDeleteColumn}
        onClosePanel={onClosePanel}
        theme={ui.themeOption == 'dark' ? 'dark' : 'light'}
      />
      <ConfirmationModal
        danger
        size="small"
        visible={isDeleting && !isUndefined(selectedColumnToDelete)}
        header={`Confirm deletion of column "${selectedColumnToDelete?.name}"`}
        children={
          <Modal.Content>
            <div className="py-4 space-y-4">
              <p className="text-sm text-scale-1100">
                Are you sure you want to delete the selected column? This action cannot be undone.
              </p>
              <Checkbox
                label="Drop column with cascade?"
                description="Deletes the column and its dependent objects"
                checked={isDeleteWithCascade}
                onChange={() => setIsDeleteWithCascade(!isDeleteWithCascade)}
              />
              {isDeleteWithCascade && (
                <Alert
                  withIcon
                  variant="warning"
                  title="Warning: Dropping with cascade may result in unintended consequences"
                >
                  <p className="mb-4">
                    All dependent objects will be removed, as will any objects that depend on them,
                    recursively.
                  </p>
                  <Link href="https://www.postgresql.org/docs/current/ddl-depend.html">
                    <a target="_blank">
                      <Button size="tiny" type="default" icon={<IconExternalLink />}>
                        About dependency tracking
                      </Button>
                    </a>
                  </Link>
                </Alert>
              )}
            </div>
          </Modal.Content>
        }
        buttonLabel="Delete"
        buttonLoadingLabel="Deleting"
        onSelectCancel={() => {
          setIsDeleting(false)
          setSelectedColumnToDelete(undefined)
        }}
        onSelectConfirm={onConfirmDeleteColumn}
      />
      <ConfirmationModal
        danger
        size="small"
        visible={isDeleting && !isUndefined(selectedTableToDelete)}
        header={
          <span className="break-words">{`Confirm deletion of table "${selectedTableToDelete?.name}"`}</span>
        }
        children={
          <Modal.Content>
            <div className="py-4 space-y-4">
              <p className="text-sm text-scale-1100">
                Are you sure you want to delete the selected table? This action cannot be undone.
              </p>
              <Checkbox
                label="Drop table with cascade?"
                description="Deletes the table and its dependent objects"
                checked={isDeleteWithCascade}
                onChange={() => setIsDeleteWithCascade(!isDeleteWithCascade)}
              />
              {isDeleteWithCascade && (
                <Alert
                  withIcon
                  variant="warning"
                  title="Warning: Dropping with cascade may result in unintended consequences"
                >
                  <p className="mb-4">
                    All dependent objects will be removed, as will any objects that depend on them,
                    recursively.
                  </p>
                  <Link href="https://www.postgresql.org/docs/current/ddl-depend.html">
                    <a target="_blank">
                      <Button size="tiny" type="default" icon={<IconExternalLink />}>
                        About dependency tracking
                      </Button>
                    </a>
                  </Link>
                </Alert>
              )}
            </div>
          </Modal.Content>
        }
        buttonLabel="Delete"
        buttonLoadingLabel="Deleting"
        onSelectCancel={() => {
          setIsDeleting(false)
          setSelectedTableToDelete(undefined)
        }}
        onSelectConfirm={onConfirmDeleteTable}
      />
    </TableEditorLayout>
  )
}

export default withAuth(observer(TableEditorPage))
