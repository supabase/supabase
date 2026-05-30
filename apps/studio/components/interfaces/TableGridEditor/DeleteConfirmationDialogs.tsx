import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Alert, AlertDescription, AlertTitle, Button, Checkbox } from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

import { useTableFilter } from '@/components/grid/hooks/useTableFilter'
import type { SupaRow } from '@/components/grid/types'
import { useDatabaseColumnDeleteMutation } from '@/data/database-columns/database-column-delete-mutation'
import { useMaterializedViewDeleteMutation } from '@/data/materialized-views/materialized-view-delete-mutation'
import { Entity } from '@/data/table-editor/table-editor-types'
import { useTableRowDeleteAllMutation } from '@/data/table-rows/table-row-delete-all-mutation'
import { useTableRowDeleteMutation } from '@/data/table-rows/table-row-delete-mutation'
import { useTableRowTruncateMutation } from '@/data/table-rows/table-row-truncate-mutation'
import { useTableDeleteMutation } from '@/data/tables/table-delete-mutation'
import { useViewDeleteMutation } from '@/data/views/view-delete-mutation'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useGetImpersonatedRoleState } from '@/state/role-impersonation-state'
import { useTableEditorStateSnapshot } from '@/state/table-editor'

export type DeleteConfirmationDialogsProps = {
  selectedTable?: Entity
  onTableDeleted?: () => void
}

const DeleteConfirmationDialogs = ({
  selectedTable,
  onTableDeleted,
}: DeleteConfirmationDialogsProps) => {
  const { data: project } = useSelectedProjectQuery()
  const snap = useTableEditorStateSnapshot()
  const { filters, setFilters } = useTableFilter()

  const removeDeletedColumnFromFiltersAndSorts = ({
    columnName,
  }: {
    ref?: string
    tableName?: string
    schema?: string
    columnName: string
  }) => {
    setFilters(filters.filter((filter) => filter.column !== columnName))
  }

  const { mutate: deleteColumn } = useDatabaseColumnDeleteMutation({
    onSuccess: () => {
      if (!(snap.confirmationDialog?.type === 'column')) return
      const selectedColumnToDelete = snap.confirmationDialog.column
      removeDeletedColumnFromFiltersAndSorts({ columnName: selectedColumnToDelete.name })
      toast.success(`Successfully deleted column "${selectedColumnToDelete.name}"`)
    },
    onError: (error) => {
      if (!(snap.confirmationDialog?.type === 'column')) return
      const selectedColumnToDelete = snap.confirmationDialog.column
      toast.error(`Failed to delete ${selectedColumnToDelete!.name}: ${error.message}`)
    },
    onSettled: () => {
      snap.closeConfirmationDialog()
    },
  })
  const { mutate: deleteTable } = useTableDeleteMutation({
    onSuccess: async () => {
      toast.success(`Successfully deleted table "${selectedTable?.name}"`)
      onTableDeleted?.()
    },
    onError: (error) => {
      toast.error(`Failed to delete ${selectedTable?.name}: ${error.message}`)
    },
    onSettled: () => {
      snap.closeConfirmationDialog()
    },
  })

  const { mutate: deleteView } = useViewDeleteMutation({
    onSuccess: async () => {
      toast.success(`Successfully deleted view "${selectedTable?.name}"`)
      onTableDeleted?.()
    },
    onError: (error) => {
      toast.error(`Failed to delete ${selectedTable?.name}: ${error.message}`)
    },
    onSettled: () => {
      snap.closeConfirmationDialog()
    },
  })

  const { mutate: deleteMaterializedView } = useMaterializedViewDeleteMutation({
    onSuccess: async () => {
      toast.success(`Successfully deleted materialized view "${selectedTable?.name}"`)
      onTableDeleted?.()
    },
    onError: (error) => {
      toast.error(`Failed to delete ${selectedTable?.name}: ${error.message}`)
    },
    onSettled: () => {
      snap.closeConfirmationDialog()
    },
  })

  const { mutate: deleteRows, isPending: isDeletingRows } = useTableRowDeleteMutation({
    onSuccess: () => {
      if (snap.confirmationDialog?.type === 'row') {
        snap.confirmationDialog.callback?.()
      }
      toast.success(`Successfully deleted selected row(s)`)
    },
    onSettled: () => {
      snap.closeConfirmationDialog()
    },
  })

  const { mutate: deleteAllRows, isPending: isDeletingAllRows } = useTableRowDeleteAllMutation({
    onSuccess: () => {
      if (snap.confirmationDialog?.type === 'row') {
        snap.confirmationDialog.callback?.()
      }
      toast.success(`Successfully deleted selected rows`)
    },
    onError: (error) => {
      toast.error(`Failed to delete rows: ${error.message}`)
    },
    onSettled: () => {
      snap.closeConfirmationDialog()
    },
  })

  const { mutate: truncateRows, isPending: isTruncatingRows } = useTableRowTruncateMutation({
    onSuccess: () => {
      if (snap.confirmationDialog?.type === 'row') {
        snap.confirmationDialog.callback?.()
      }
      toast.success(`Successfully deleted all rows from table`)
    },
    onError: (error) => {
      toast.error(`Failed to delete rows: ${error.message}`)
    },
    onSettled: () => {
      snap.closeConfirmationDialog()
    },
  })

  const isAllRowsSelected =
    snap.confirmationDialog?.type === 'row' ? snap.confirmationDialog.allRowsSelected : false
  const numRows =
    snap.confirmationDialog?.type === 'row'
      ? snap.confirmationDialog.allRowsSelected
        ? (snap.confirmationDialog.numRows ?? 0)
        : snap.confirmationDialog.rows.length
      : 0

  const isDeleteWithCascade =
    snap.confirmationDialog?.type === 'column' ||
    snap.confirmationDialog?.type === 'table' ||
    snap.confirmationDialog?.type === 'view' ||
    snap.confirmationDialog?.type === 'materialized-view'
      ? snap.confirmationDialog.isDeleteWithCascade
      : false

  const onConfirmDeleteColumn = async () => {
    if (!(snap.confirmationDialog?.type === 'column')) return
    if (project === undefined) return

    const selectedColumnToDelete = snap.confirmationDialog.column
    if (selectedColumnToDelete === undefined) return

    deleteColumn({
      column: selectedColumnToDelete,
      cascade: isDeleteWithCascade,
      projectRef: project.ref,
      connectionString: project?.connectionString,
    })
  }

  const onConfirmDeleteTable = async () => {
    if (!(snap.confirmationDialog?.type === 'table')) return
    const selectedTableToDelete = selectedTable

    if (selectedTableToDelete === undefined) return

    deleteTable({
      projectRef: project?.ref!,
      connectionString: project?.connectionString,
      id: selectedTableToDelete.id,
      name: selectedTableToDelete.name,
      schema: selectedTableToDelete.schema,
      cascade: isDeleteWithCascade,
    })
  }

  const onConfirmDeleteView = async () => {
    if (snap.confirmationDialog?.type !== 'view') return
    if (!project || !selectedTable) return

    deleteView({
      projectRef: project.ref,
      connectionString: project.connectionString,
      id: selectedTable.id,
      name: selectedTable.name,
      schema: selectedTable.schema,
      cascade: isDeleteWithCascade,
    })
  }

  const onConfirmDeleteMaterializedView = async () => {
    if (snap.confirmationDialog?.type !== 'materialized-view') return
    if (!project || !selectedTable) return

    deleteMaterializedView({
      projectRef: project.ref,
      connectionString: project.connectionString,
      id: selectedTable.id,
      name: selectedTable.name,
      schema: selectedTable.schema,
      cascade: isDeleteWithCascade,
    })
  }

  const getImpersonatedRoleState = useGetImpersonatedRoleState()

  const onConfirmDeleteRow = async () => {
    if (!project) return console.error('Project ref is required')
    if (!selectedTable) return console.error('Selected table required')
    if (snap.confirmationDialog?.type !== 'row') return
    const selectedRowsToDelete = snap.confirmationDialog.rows

    if (snap.confirmationDialog.allRowsSelected) {
      if (filters.length === 0) {
        if (getImpersonatedRoleState().role !== undefined) {
          snap.closeConfirmationDialog()
          return toast.error('Table truncation is not supported when impersonating a role')
        }

        truncateRows({
          projectRef: project.ref,
          connectionString: project.connectionString,
          table: selectedTable,
        })
      } else {
        deleteAllRows({
          projectRef: project.ref,
          connectionString: project.connectionString,
          table: selectedTable,
          filters,
          roleImpersonationState: getImpersonatedRoleState(),
        })
      }
    } else {
      deleteRows({
        projectRef: project.ref,
        connectionString: project.connectionString,
        table: selectedTable,
        rows: selectedRowsToDelete as SupaRow[],
        roleImpersonationState: getImpersonatedRoleState(),
      })
    }
  }

  return (
    <>
      <ConfirmationModal
        variant="destructive"
        size="small"
        visible={snap.confirmationDialog?.type === 'column'}
        title={`Confirm deletion of column "${
          snap.confirmationDialog?.type === 'column' && snap.confirmationDialog.column.name
        }"`}
        confirmLabel="Delete"
        confirmLabelLoading="Deleting"
        onCancel={() => {
          snap.closeConfirmationDialog()
        }}
        onConfirm={onConfirmDeleteColumn}
      >
        <div className="space-y-4">
          <p className="text-sm text-foreground-light">
            Are you sure you want to delete the selected column? This action cannot be undone.
          </p>
          <div className="items-top flex space-x-2">
            <Checkbox
              id="checkbox-cascade"
              checked={isDeleteWithCascade}
              onCheckedChange={() => snap.toggleConfirmationIsWithCascade()}
            />
            <div className="grid gap-1.5 leading-none">
              <label
                htmlFor="checkbox-cascade"
                className="text-sm text-foreground-light leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Drop column with cascade?
              </label>
              <p className="text-sm text-foreground-muted">
                Deletes the column and its dependent objects
              </p>
            </div>
          </div>
          {isDeleteWithCascade && (
            <Alert
              variant="warning"
              title="Warning: Dropping with cascade may result in unintended consequences"
            >
              <AlertTitle>
                All dependent objects will be removed, as will any objects that depend on them,
                recursively.
              </AlertTitle>
              <AlertDescription>
                <Button asChild size="tiny" type="default" icon={<ExternalLink />}>
                  <Link
                    href="https://www.postgresql.org/docs/current/ddl-depend.html"
                    target="_blank"
                    rel="noreferrer"
                  >
                    About dependency tracking
                  </Link>
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </div>
      </ConfirmationModal>

      <ConfirmationModal
        variant={'destructive'}
        size="small"
        visible={snap.confirmationDialog?.type === 'table'}
        title={
          <span className="wrap-break-word">{`Confirm deletion of table "${selectedTable?.name}"`}</span>
        }
        confirmLabel="Delete"
        confirmLabelLoading="Deleting"
        onCancel={() => {
          snap.closeConfirmationDialog()
        }}
        onConfirm={onConfirmDeleteTable}
      >
        <div data-testid="confirm-delete-table-modal" className="space-y-4">
          <p className="text-sm text-foreground-light">
            Are you sure you want to delete the selected table? This action cannot be undone.
          </p>
          <div className="items-top flex space-x-2">
            <Checkbox
              id="checkbox-cascade"
              checked={isDeleteWithCascade}
              onCheckedChange={() => snap.toggleConfirmationIsWithCascade(!isDeleteWithCascade)}
            />
            <div className="grid gap-1.5 leading-none">
              <label
                htmlFor="checkbox-cascade"
                className="text-sm text-foreground-light leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Drop table with cascade?
              </label>
              <p className="text-sm text-foreground-muted">
                Deletes the table and its dependent objects
              </p>
            </div>
          </div>
          {isDeleteWithCascade && (
            <Alert variant="warning">
              <AlertTitle>
                Warning: Dropping with cascade may result in unintended consequences
              </AlertTitle>
              <AlertDescription>
                All dependent objects will be removed, as will any objects that depend on them,
                recursively.
              </AlertDescription>
              <AlertDescription className="mt-4">
                <Button asChild size="tiny" type="default" icon={<ExternalLink />}>
                  <Link
                    href="https://www.postgresql.org/docs/current/ddl-depend.html"
                    target="_blank"
                    rel="noreferrer"
                  >
                    About dependency tracking
                  </Link>
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </div>
      </ConfirmationModal>

      <DropEntityConfirmationModal
        visible={snap.confirmationDialog?.type === 'view'}
        entityLabel="view"
        entityName={selectedTable?.name}
        isDeleteWithCascade={isDeleteWithCascade}
        onToggleCascade={() => snap.toggleConfirmationIsWithCascade(!isDeleteWithCascade)}
        onCancel={() => snap.closeConfirmationDialog()}
        onConfirm={onConfirmDeleteView}
      />

      <DropEntityConfirmationModal
        visible={snap.confirmationDialog?.type === 'materialized-view'}
        entityLabel="materialized view"
        entityName={selectedTable?.name}
        isDeleteWithCascade={isDeleteWithCascade}
        onToggleCascade={() => snap.toggleConfirmationIsWithCascade(!isDeleteWithCascade)}
        onCancel={() => snap.closeConfirmationDialog()}
        onConfirm={onConfirmDeleteMaterializedView}
      />

      <ConfirmationModal
        variant={'destructive'}
        size="small"
        visible={snap.confirmationDialog?.type === 'row'}
        title={
          <p className="wrap-break-word">
            <span>Confirm to delete the selected row</span>
            <span>{numRows > 1 && 's'}</span>
          </p>
        }
        confirmLabel="Delete"
        confirmLabelLoading="Deleting"
        onCancel={() => snap.closeConfirmationDialog()}
        onConfirm={() => onConfirmDeleteRow()}
        loading={isTruncatingRows || isDeletingRows || isDeletingAllRows}
      >
        <div className="space-y-4">
          <p className="text-sm text-foreground-light">
            <span>Are you sure you want to delete </span>
            <span>{isAllRowsSelected ? 'all' : 'the selected'} </span>
            <span>{numRows > 1 && `${numRows} `}</span>
            <span>row</span>
            <span>{numRows > 1 && 's'}</span>
            <span>? This action cannot be undone.</span>
          </p>
        </div>
      </ConfirmationModal>
    </>
  )
}

export default DeleteConfirmationDialogs

type DropEntityConfirmationModalProps = {
  visible: boolean
  entityLabel: 'view' | 'materialized view'
  entityName?: string
  isDeleteWithCascade: boolean
  onToggleCascade: () => void
  onCancel: () => void
  onConfirm: () => void
}

const DropEntityConfirmationModal = ({
  visible,
  entityLabel,
  entityName,
  isDeleteWithCascade,
  onToggleCascade,
  onCancel,
  onConfirm,
}: DropEntityConfirmationModalProps) => {
  const checkboxId = `checkbox-cascade-${entityLabel.replace(/\s+/g, '-')}`
  return (
    <ConfirmationModal
      variant="destructive"
      size="small"
      visible={visible}
      title={
        <span className="wrap-break-word">{`Confirm deletion of ${entityLabel} "${entityName ?? ''}"`}</span>
      }
      confirmLabel="Delete"
      confirmLabelLoading="Deleting"
      onCancel={onCancel}
      onConfirm={onConfirm}
    >
      <div className="space-y-4">
        <p className="text-sm text-foreground-light">
          Are you sure you want to delete this {entityLabel}? This action cannot be undone.
        </p>
        <div className="items-top flex space-x-2">
          <Checkbox
            id={checkboxId}
            checked={isDeleteWithCascade}
            onCheckedChange={onToggleCascade}
          />
          <div className="grid gap-1.5 leading-none">
            <label
              htmlFor={checkboxId}
              className="text-sm text-foreground-light leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Drop {entityLabel} with cascade?
            </label>
            <p className="text-sm text-foreground-muted">
              Deletes the {entityLabel} and its dependent objects
            </p>
          </div>
        </div>
        {isDeleteWithCascade && (
          <Alert variant="warning">
            <AlertTitle>
              Warning: Dropping with cascade may result in unintended consequences
            </AlertTitle>
            <AlertDescription>
              All dependent objects will be removed, as will any objects that depend on them,
              recursively.
            </AlertDescription>
            <AlertDescription className="mt-4">
              <Button asChild size="tiny" type="default" icon={<ExternalLink />}>
                <Link
                  href="https://www.postgresql.org/docs/current/ddl-depend.html"
                  target="_blank"
                  rel="noreferrer"
                >
                  About dependency tracking
                </Link>
              </Button>
            </AlertDescription>
          </Alert>
        )}
      </div>
    </ConfirmationModal>
  )
}
