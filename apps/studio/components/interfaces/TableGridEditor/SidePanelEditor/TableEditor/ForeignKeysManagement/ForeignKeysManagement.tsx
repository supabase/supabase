import { useState } from 'react'
import { Button } from 'ui'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import AlertError from 'components/ui/AlertError'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useForeignKeyConstraintsQuery } from 'data/database/foreign-key-constraints-query'
import { useTableEditorStateSnapshot } from 'state/table-editor'
import { ResponseError } from 'types'
import { ForeignKeySelector } from '../../ForeignKeySelectorV2/ForeignKeySelector'
import { TableField } from '../TableEditor.types'
import { ForeignKeyRow } from './ForeignKeyRow'
import { ForeignKey } from '../../ForeignKeySelectorV2/ForeignKeySelector.types'

interface ForeignKeysManagementProps {
  table: TableField
  relations: ForeignKey[]
  closePanel: () => void
  onUpdateFkRelations: (relations: ForeignKey[]) => void
}

export const ForeignKeysManagement = ({
  table,
  relations,
  closePanel,
  onUpdateFkRelations,
}: ForeignKeysManagementProps) => {
  const { project } = useProjectContext()
  const snap = useTableEditorStateSnapshot()

  const [open, setOpen] = useState(false)
  const [selectedFk, setSelectedFk] = useState<ForeignKey>()

  const { data, error, isLoading, isSuccess, isError } = useForeignKeyConstraintsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    schema: snap.selectedSchemaName,
  })
  const existingForeignKeyIds = (data ?? []).map((x) => x.id)

  const getRelationStatus = (fk: ForeignKey) => {
    const existingRelation = (data ?? []).find((x) => x.id === fk.id)
    const stateRelation = relations.find((x) => x.id === fk.id)
    if (typeof fk.id === 'string') {
      return 'ADD'
    } else if (typeof fk.id === 'number') {
      if (existingRelation !== undefined && stateRelation === undefined) {
        return 'REMOVE'
      } else {
        // [Joshen] Logic to determine if update, or no change
      }
    }
  }

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
            {relations.map((fk) => {
              return (
                <ForeignKeyRow
                  key={fk.id}
                  status={''}
                  foreignKey={fk}
                  closePanel={closePanel}
                  onSelectEdit={() => {
                    setOpen(true)
                    setSelectedFk(fk)
                  }}
                  onSelectRemove={() =>
                    onUpdateFkRelations(relations.filter((x) => x.id !== fk.id))
                  }
                />
              )
            })}
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
        onSaveRelation={(fk) => {
          const existingRelationIds = relations.map((x) => x.id)
          if (existingRelationIds.includes(fk.id)) {
            onUpdateFkRelations(
              relations.map((x) => {
                if (x.id === fk.id) return fk
                return x
              })
            )
          } else {
            onUpdateFkRelations(relations.concat([fk]))
          }
        }}
      />
    </>
  )
}
