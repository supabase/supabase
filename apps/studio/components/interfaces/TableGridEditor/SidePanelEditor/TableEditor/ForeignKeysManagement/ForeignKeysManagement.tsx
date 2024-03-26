import { useState } from 'react'
import { Button } from 'ui'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import AlertError from 'components/ui/AlertError'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useForeignKeyConstraintsQuery } from 'data/database/foreign-key-constraints-query'
import { useTableEditorStateSnapshot } from 'state/table-editor'
import type { ResponseError } from 'types'
import { ForeignKeySelector } from '../../ForeignKeySelector/ForeignKeySelector'
import type { TableField } from '../TableEditor.types'
import { ForeignKeyRow } from './ForeignKeyRow'
import type { ForeignKey } from '../../ForeignKeySelector/ForeignKeySelector.types'
import { checkIfRelationChanged } from './ForeignKeysManagement.utils'
import { uuidv4 } from 'lib/helpers'

interface ForeignKeysManagementProps {
  table: TableField
  relations: ForeignKey[]
  closePanel: () => void
  setEditorDirty: () => void
  onUpdateFkRelations: (relations: ForeignKey[]) => void
}

export const ForeignKeysManagement = ({
  table,
  relations,
  closePanel,
  setEditorDirty,
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

  const getRelationStatus = (fk: ForeignKey) => {
    const existingRelation = (data ?? []).find((x) => x.id === fk.id)
    const stateRelation = relations.find((x) => x.id === fk.id)

    if (stateRelation?.toRemove) return 'REMOVE'
    if (existingRelation === undefined && stateRelation !== undefined) return 'ADD'
    if (existingRelation !== undefined && stateRelation !== undefined) {
      const hasUpdated = checkIfRelationChanged(existingRelation, stateRelation)
      if (hasUpdated) return 'UPDATE'
      else return undefined
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
              const status = getRelationStatus(fk)
              return (
                <ForeignKeyRow
                  key={fk.id}
                  status={status}
                  foreignKey={fk}
                  closePanel={closePanel}
                  onSelectEdit={() => {
                    setOpen(true)
                    setSelectedFk(fk)
                  }}
                  onSelectRemove={() => {
                    setEditorDirty()
                    if (status === 'ADD') {
                      const updatedRelations = relations.filter((x) => x.id !== fk.id)
                      onUpdateFkRelations(updatedRelations)
                    } else {
                      const updatedRelations = relations.map((x) => {
                        if (x.id === fk.id) return { ...x, toRemove: true }
                        else return x
                      })
                      onUpdateFkRelations(updatedRelations)
                    }
                  }}
                  onSelectUndoRemove={() => {
                    setEditorDirty()
                    const updatedRelations = relations.map((x) => {
                      if (x.id === fk.id) return { ...x, toRemove: false }
                      else return x
                    })
                    onUpdateFkRelations(updatedRelations)
                  }}
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
        table={{ id: table.id, name: table.name, columns: table.columns }}
        foreignKey={selectedFk}
        onClose={() => {
          setOpen(false)
          setSelectedFk(undefined)
        }}
        onSaveRelation={(fk) => {
          setEditorDirty()
          const existingRelationIds = relations.map((x) => x.id)
          if (fk.id !== undefined && existingRelationIds.includes(fk.id)) {
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
