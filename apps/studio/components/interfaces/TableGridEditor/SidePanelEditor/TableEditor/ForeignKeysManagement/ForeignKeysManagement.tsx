import { useState } from 'react'
import { Button } from 'ui'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import AlertError from 'components/ui/AlertError'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import {
  ForeignKeyConstraint,
  useForeignKeyConstraintsQuery,
} from 'data/database/foreign-key-constraints-query'
import { useTableEditorStateSnapshot } from 'state/table-editor'
import { ResponseError } from 'types'
import { ForeignKeySelector } from '../../ForeignKeySelectorV2/ForeignKeySelector'
import { TableField } from '../TableEditor.types'
import { ForeignKey } from './ForeignKey'

interface ForeignKeysManagementProps {
  table: TableField
  closePanel: () => void
}

export const ForeignKeysManagement = ({ table, closePanel }: ForeignKeysManagementProps) => {
  const { project } = useProjectContext()
  const snap = useTableEditorStateSnapshot()

  const [open, setOpen] = useState(false)
  const [selectedFk, setSelectedFk] = useState<ForeignKeyConstraint>()

  const { data, error, isLoading, isSuccess, isError } = useForeignKeyConstraintsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    schema: snap.selectedSchemaName,
  })

  const foreignKeys = (data ?? []).filter((fk) => fk.source_table === table.name)

  return (
    <>
      <div className="w-full space-y-4 ">
        <h5>Foreign keys</h5>

        {isLoading && <GenericSkeletonLoader />}

        {isError && (
          <AlertError
            error={error as unknown as ResponseError}
            subject="Failed to retrieve foreign key relationships"
          />
        )}

        {isSuccess && (
          <div>
            {foreignKeys.map((fk) => (
              <ForeignKey
                key={fk.id}
                foreignKey={fk}
                closePanel={closePanel}
                onSelectEdit={() => {
                  setOpen(true)
                  setSelectedFk(fk)
                }}
                onSelectRemove={() => {}}
              />
            ))}
          </div>
        )}

        <div className="flex items-center justify-center rounded border border-strong border-dashed py-3">
          <Button type="default" onClick={() => setOpen(true)}>
            Add foreign key relation
          </Button>
        </div>
      </div>
      <ForeignKeySelector
        visible={open}
        table={table}
        foreignKey={selectedFk}
        onClose={() => {
          setOpen(false)
          setSelectedFk(undefined)
        }}
      />
    </>
  )
}
