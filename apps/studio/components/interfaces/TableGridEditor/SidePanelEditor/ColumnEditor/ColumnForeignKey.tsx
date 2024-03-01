import { useParams } from 'common'
import { noop } from 'lodash'
import { useState } from 'react'
import { Button } from 'ui'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useForeignKeyConstraintsQuery } from 'data/database/foreign-key-constraints-query'
import useTable from 'hooks/misc/useTable'
import { useTableEditorStateSnapshot } from 'state/table-editor'
import { ForeignKeySelector } from '../ForeignKeySelector/ForeignKeySelector'
import { ForeignKey } from '../ForeignKeySelector/ForeignKeySelector.types'
import { ColumnField } from '../SidePanelEditor.types'
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

  const { project } = useProjectContext()
  const { data } = useForeignKeyConstraintsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    schema: column.schema,
  })

  console.log({ column })

  const id = _id ? Number(_id) : undefined
  const { data: table } = useTable(id)

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
        <div>
          {relations.map((relation) => {
            const status = getRelationStatus(relation)
            return (
              <ForeignKeyRow
                disabled
                key={relation.id}
                layout="vertical"
                status={status}
                foreignKey={relation}
                closePanel={closePanel}
                onSelectEdit={noop}
                onSelectRemove={noop}
                onSelectUndoRemove={noop}
              />
            )
          })}
        </div>

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
                ? (table.columns as any[]).concat(column)
                : (table.columns as any[]),
          }}
          foreignKey={undefined}
          onClose={() => {
            setOpen(false)
            // setSelectedFk(undefined)
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
