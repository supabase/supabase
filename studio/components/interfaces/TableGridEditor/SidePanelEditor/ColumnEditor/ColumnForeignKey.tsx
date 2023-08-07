import { isUndefined } from 'lodash'
import { Badge, Button, IconArrowRight } from 'ui'

import InformationBox from 'components/ui/InformationBox'
import type { ExtendedPostgresRelationship } from '../SidePanelEditor.types'
import { ColumnField } from '../SidePanelEditor.types'
import { getForeignKeyDeletionAction, getForeignKeyUIState } from './ColumnEditor.utils'

interface ColumnForeignKeyProps {
  column: ColumnField
  originalForeignKey: ExtendedPostgresRelationship | undefined
  onSelectEditRelation: () => void
  onSelectRemoveRelation: () => void
  onSelectCancelRemoveRelation: () => void
}

const ColumnForeignKey = ({
  column,
  originalForeignKey,
  onSelectEditRelation,
  onSelectRemoveRelation,
  onSelectCancelRemoveRelation,
}: ColumnForeignKeyProps) => {
  const hasNoForeignKey = isUndefined(originalForeignKey) && isUndefined(column?.foreignKey)
  if (hasNoForeignKey) {
    return (
      <Button type="default" onClick={onSelectEditRelation}>
        Add foreign key relation
      </Button>
    )
  }

  const foreignKeyUIState = getForeignKeyUIState(originalForeignKey, column?.foreignKey)

  switch (foreignKeyUIState) {
    case 'Add':
      return (
        <ColumnForeignKeyAdded
          columnName={column.name}
          foreignKey={column.foreignKey}
          onSelectEditRelation={onSelectEditRelation}
          onSelectRemoveRelation={onSelectRemoveRelation}
        />
      )
    case 'Remove':
      return (
        <ColumnForeignKeyRemoved
          columnName={column.name}
          originalForeignKey={originalForeignKey}
          onSelectEditRelation={onSelectEditRelation}
          onSelectCancelRemoveRelation={onSelectCancelRemoveRelation}
        />
      )
    case 'Update':
      return (
        <ColumnForeignKeyUpdated
          columnName={column.name}
          originalForeignKey={originalForeignKey}
          updatedForeignKey={column.foreignKey}
          onSelectEditRelation={onSelectEditRelation}
          onSelectRemoveRelation={onSelectRemoveRelation}
        />
      )
    case 'Info':
      return (
        <ColumnForeignKeyInformation
          columnName={column.name}
          foreignKey={column.foreignKey}
          onSelectEditRelation={onSelectEditRelation}
          onSelectRemoveRelation={onSelectRemoveRelation}
        />
      )
    default:
      return <div />
  }
}

export default ColumnForeignKey

// Just to break the components into smaller ones, we can create separate files for these

interface ColumnForeignKeyInformationProps {
  columnName: string
  foreignKey?: ExtendedPostgresRelationship
  onSelectEditRelation: () => void
  onSelectRemoveRelation: () => void
}

const ColumnForeignKeyInformation = ({
  columnName,
  foreignKey,
  onSelectEditRelation,
  onSelectRemoveRelation,
}: ColumnForeignKeyInformationProps) => {
  const deletionAction = getForeignKeyDeletionAction(foreignKey?.deletion_action)
  return (
    <InformationBox
      block
      title={
        <div className="flex flex-col space-y-4">
          <div className="space-y-2">
            <p className="text-scale-1100">This column has the following foreign key relation:</p>
            <div className="flex items-center space-x-2 text-scale-1200">
              <span className="text-xs text-code font-mono">{columnName}</span>
              <IconArrowRight size={14} strokeWidth={2} />
              <span className="text-xs text-code font-mono">
                {foreignKey?.target_table_schema}.{foreignKey?.target_table_name}.
                {foreignKey?.target_column_name}
              </span>
              {deletionAction !== undefined && (
                <Badge color="gray">On delete: {deletionAction}</Badge>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button type="outline" onClick={onSelectEditRelation}>
              Edit relation
            </Button>
            <Button type="outline" onClick={onSelectRemoveRelation}>
              Remove
            </Button>
          </div>
        </div>
      }
    />
  )
}

interface ColumnForeignKeyAddedProps {
  columnName: string
  foreignKey?: ExtendedPostgresRelationship
  onSelectEditRelation: () => void
  onSelectRemoveRelation: () => void
}

const ColumnForeignKeyAdded = ({
  columnName,
  foreignKey,
  onSelectEditRelation,
  onSelectRemoveRelation,
}: ColumnForeignKeyAddedProps) => {
  const deletionAction = getForeignKeyDeletionAction(foreignKey?.deletion_action)
  return (
    <InformationBox
      block
      title={
        <div className="flex flex-col space-y-4 text-scale-1100">
          <div className="space-y-2">
            <span>
              The following foreign key relation will be <span className="text-brand">added</span>:
            </span>
            <div className="flex items-center space-x-2 text-scale-1200">
              <span
                className={`${
                  columnName.length > 0 ? 'text-code font-mono text-xs' : ''
                } max-w-xs truncate`}
              >
                {columnName || 'This column'}
              </span>
              <IconArrowRight size={14} strokeWidth={2} />
              <span className="max-w-xs text-xs truncate text-code font-mono">
                {foreignKey?.target_table_schema}.{foreignKey?.target_table_name}.
                {foreignKey?.target_column_name}
              </span>
              {deletionAction !== undefined && (
                <Badge color="gray">On delete: {deletionAction}</Badge>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button type="outline" onClick={onSelectEditRelation}>
              Edit relation
            </Button>
            <Button type="outline" onClick={onSelectRemoveRelation}>
              Remove
            </Button>
          </div>
        </div>
      }
    />
  )
}

interface ColumnForeignKeyRemovedProps {
  columnName: string
  originalForeignKey?: ExtendedPostgresRelationship
  onSelectEditRelation: () => void
  onSelectCancelRemoveRelation: () => void
}

const ColumnForeignKeyRemoved = ({
  columnName,
  originalForeignKey,
  onSelectEditRelation,
  onSelectCancelRemoveRelation,
}: ColumnForeignKeyRemovedProps) => {
  return (
    <InformationBox
      block
      title={
        <div className="flex flex-col space-y-4">
          <div className="space-y-2">
            <p className="text-scale-1100">
              The following foreign key relation will be{' '}
              <span className="text-amber-900">removed</span>:
            </p>
            <div className="flex items-center space-x-2">
              <code className="text-xs font-mono">{columnName}</code>
              <IconArrowRight size={14} strokeWidth={2} />
              <code className="text-xs font-mono">
                {originalForeignKey?.target_table_schema}.{originalForeignKey?.target_table_name}.
                {originalForeignKey?.target_column_name}
              </code>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button type="outline" onClick={onSelectEditRelation}>
              Edit relation
            </Button>
            <Button type="outline" onClick={onSelectCancelRemoveRelation}>
              Cancel remove
            </Button>
          </div>
        </div>
      }
    />
  )
}

interface ColumnForeignKeyUpdatedProps {
  columnName: string
  originalForeignKey?: ExtendedPostgresRelationship
  updatedForeignKey?: ExtendedPostgresRelationship
  onSelectEditRelation: () => void
  onSelectRemoveRelation: () => void
}

const ColumnForeignKeyUpdated = ({
  columnName,
  originalForeignKey,
  updatedForeignKey,
  onSelectEditRelation,
  onSelectRemoveRelation,
}: ColumnForeignKeyUpdatedProps) => {
  const originalKey = `${originalForeignKey?.target_table_schema}.${originalForeignKey?.target_table_name}.${originalForeignKey?.target_column_name}`
  const updatedKey = `${updatedForeignKey?.target_table_schema}.${updatedForeignKey?.target_table_name}.${updatedForeignKey?.target_column_name}`

  const originalDeletionAction = getForeignKeyDeletionAction(originalForeignKey?.deletion_action)
  const updatedDeletionAction = getForeignKeyDeletionAction(updatedForeignKey?.deletion_action)

  return (
    <InformationBox
      block
      title={
        <div className="flex flex-col space-y-4">
          <div className="space-y-2">
            <p>
              The foreign key relation will be <span className="text-brand">updated</span> as such:
            </p>
            <div className="flex items-start space-x-2">
              <code className="text-xs font-mono">{columnName}</code>
              <IconArrowRight className="mt-1" size={14} strokeWidth={2} />
              <div className="flex flex-col space-y-2">
                {originalKey !== updatedKey && (
                  <p className="line-through">
                    <code className="text-xs font-mono">{originalKey}</code>
                  </p>
                )}
                <code className="text-xs font-mono">{updatedKey}</code>
              </div>
              <div className="flex flex-col space-y-2">
                {originalDeletionAction !== undefined &&
                  originalDeletionAction !== updatedDeletionAction && (
                    <Badge color="gray" className="line-through">
                      On delete: {originalDeletionAction}
                    </Badge>
                  )}
                {updatedDeletionAction !== undefined && (
                  <div>
                    <Badge color="green">On delete: {updatedDeletionAction}</Badge>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button type="outline" onClick={onSelectEditRelation}>
              Edit relation
            </Button>
            <Button type="outline" onClick={onSelectRemoveRelation}>
              Remove
            </Button>
          </div>
        </div>
      }
    />
  )
}
