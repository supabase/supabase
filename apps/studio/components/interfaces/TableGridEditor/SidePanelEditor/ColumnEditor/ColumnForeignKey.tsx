import { noop } from 'lodash'
import { AlertDescription_Shadcn_, AlertTitle_Shadcn_, Alert_Shadcn_, Button } from 'ui'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useForeignKeyConstraintsQuery } from 'data/database/foreign-key-constraints-query'
import { ForeignKey } from '../ForeignKeySelector/ForeignKeySelector.types'
import { ColumnField } from '../SidePanelEditor.types'
import { ForeignKeyRow } from '../TableEditor/ForeignKeysManagement/ForeignKeyRow'
import { checkIfRelationChanged } from '../TableEditor/ForeignKeysManagement/ForeignKeysManagement.utils'
import { useTableEditorStateSnapshot } from 'state/table-editor'

interface ColumnForeignKeyProps {
  column: ColumnField
  relations: ForeignKey[]
  closePanel: () => void
}

const ColumnForeignKey = ({ column, relations, closePanel }: ColumnForeignKeyProps) => {
  const { project } = useProjectContext()
  const snap = useTableEditorStateSnapshot()
  const { data } = useForeignKeyConstraintsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    schema: column.schema,
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
      <Alert_Shadcn_>
        <AlertTitle_Shadcn_>
          {relations.length > 0 ? (
            <>
              These are the foreign keys which the column{' '}
              <code className="text-xs">{column.name}</code> is included
            </>
          ) : column.isNewColumn ? (
            <>Foreign keys can be added after creating the column</>
          ) : (
            <>
              Foreign keys which include the column <code className="text-xs">{column.name}</code>{' '}
              will be shown here
            </>
          )}
        </AlertTitle_Shadcn_>
        <AlertDescription_Shadcn_>
          All foreign keys on the table can be managed by editing the{' '}
          <code className="text-xs">
            {column.schema}.{column.table}
          </code>{' '}
          table.
        </AlertDescription_Shadcn_>
        <Button type="default" className="mt-3" onClick={() => snap.onEditTable()}>
          Edit table
        </Button>
      </Alert_Shadcn_>
    </div>
  )
}

export default ColumnForeignKey
