import { useParams } from 'common'
import { useState } from 'react'
import { Button } from 'ui'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useForeignKeyConstraintsQuery } from 'data/database/foreign-key-constraints-query'
import { useTableEditorQuery } from 'data/table-editor/table-editor-query'
import { ForeignKeySelector } from '../ForeignKeySelector/ForeignKeySelector'
import type { ForeignKey } from '../ForeignKeySelector/ForeignKeySelector.types'
import type { ColumnField } from '../SidePanelEditor.types'
import { ForeignKeyRow } from '../TableEditor/ForeignKeysManagement/ForeignKeyRow'
import { checkIfRelationChanged } from '../TableEditor/ForeignKeysManagement/ForeignKeysManagement.utils'

interface ColumnForeignKeyProps {
  column: ColumnField
  relations: ForeignKey[]
  closePanel: () => void
  onUpdateColumnType: (type: string) => void
  onUpdateFkRelations: (fks: ForeignKey[]) => void
}

const ColumnForeignKey = ({
  column,
  relations,
  closePanel,
  onUpdateColumnType,
  onUpdateFkRelations,
}: ColumnForeignKeyProps) => {
  const { id: _id } = useParams()
  const [open, setOpen] = useState(false)
  const [selectedFk, setSelectedFk] = useState<ForeignKey>()

  const { project } = useProjectContext()
  const { data } = useForeignKeyConstraintsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    schema: column.schema,
  })

  const id = _id ? Number(_id) : undefined
  const { data: table } = useTableEditorQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    id,
  })
  const formattedColumnsForFkSelector = (table?.columns ?? []).map((c) => {
    return {
      id: c.id,
      name: c.name,
      format: c.format || column.format,
      isNewColumn: false,
    }
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
      <div className="flex flex-col gap-y-2">
        {relations.length > 0 && (
          <div>
            {relations.map((relation) => {
              const status = getRelationStatus(relation)
              return (
                <ForeignKeyRow
                  key={relation.id}
                  layout="vertical"
                  status={status}
                  foreignKey={relation}
                  closePanel={closePanel}
                  onSelectEdit={() => {
                    setOpen(true)
                    setSelectedFk(relation)
                  }}
                  onSelectRemove={() => {
                    if (status === 'ADD') {
                      const updatedRelations = relations.filter((x) => x.id !== relation.id)
                      onUpdateFkRelations(updatedRelations)
                    } else {
                      const updatedRelations = relations.map((x) => {
                        if (x.id === relation.id) return { ...x, toRemove: true }
                        else return x
                      })
                      onUpdateFkRelations(updatedRelations)
                    }
                  }}
                  onSelectUndoRemove={() => {
                    const updatedRelations = relations.map((x) => {
                      if (x.id === relation.id) return { ...x, toRemove: false }
                      else return x
                    })
                    onUpdateFkRelations(updatedRelations)
                  }}
                />
              )
            })}
          </div>
        )}

        <Button type="default" className="w-min" onClick={() => setOpen(true)}>
          Add foreign key
        </Button>
      </div>

      {table !== undefined && (
        <ForeignKeySelector
          visible={open}
          column={column}
          table={{
            id: table.id,
            name: table.name,
            columns:
              column.isNewColumn && column.name
                ? formattedColumnsForFkSelector.concat(column)
                : formattedColumnsForFkSelector.map((c) => {
                    if (c.id === column.id) return { ...c, name: column.name }
                    else return c
                  }),
          }}
          foreignKey={selectedFk}
          onClose={() => {
            setOpen(false)
            setSelectedFk(undefined)
          }}
          onSaveRelation={(fk) => {
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
            const targetType = fk.columns.find((col) => col.source === column.name)?.targetType
            if (targetType) onUpdateColumnType(targetType)
          }}
        />
      )}
    </>
  )
}

export default ColumnForeignKey
