import { isUndefined } from 'lodash'
import { Badge, Button, IconArrowRight } from 'ui'

import InformationBox from 'components/ui/InformationBox'
import type { ExtendedPostgresRelationship } from '../SidePanelEditor.types'
import { ColumnField } from '../SidePanelEditor.types'
import { getForeignKeyCascadeAction, getForeignKeyUIState } from './ColumnEditor.utils'

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
  const updateAction = getForeignKeyCascadeAction(foreignKey?.update_action)
  const deletionAction = getForeignKeyCascadeAction(foreignKey?.deletion_action)

  return (
    <InformationBox
      block
      title={
        <div className="flex flex-col space-y-4">
          <div className="space-y-2">
            <p className="text-foreground-light">
              This column has the following foreign key relation:
            </p>
            <div className="flex items-center space-x-2 text-foreground">
              <p className="text-xs text-code font-mono">{columnName}</p>
              <IconArrowRight size={14} strokeWidth={2} />
              <p className="text-xs text-code font-mono">
                {foreignKey?.target_table_schema}.{foreignKey?.target_table_name}.
                {foreignKey?.target_column_name}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {updateAction !== undefined && <Badge color="gray">On update: {updateAction}</Badge>}
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
  const updateAction = getForeignKeyCascadeAction(foreignKey?.update_action)
  const deletionAction = getForeignKeyCascadeAction(foreignKey?.deletion_action)

  return (
    <InformationBox
      block
      title={
        <div className="flex flex-col space-y-4 text-foreground-light">
          <div className="space-y-2">
            <span>
              The following foreign key relation will be <span className="text-brand">added</span>:
            </span>
            <div className="flex items-center space-x-2 text-foreground">
              <p
                className={`${
                  columnName.length > 0 ? 'text-code font-mono text-xs' : ''
                } max-w-xs truncate`}
              >
                {columnName || 'This column'}
              </p>
              <IconArrowRight size={14} strokeWidth={2} />
              <p className="max-w-xs text-xs truncate text-code font-mono">
                {foreignKey?.target_table_schema}.{foreignKey?.target_table_name}.
                {foreignKey?.target_column_name}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {updateAction !== undefined && <Badge color="gray">On update: {updateAction}</Badge>}
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
            <p className="text-foreground-light">
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

  const originalUpdateAction = getForeignKeyCascadeAction(originalForeignKey?.update_action)
  const updatedUpdateAction = getForeignKeyCascadeAction(updatedForeignKey?.update_action)

  const originalDeletionAction = getForeignKeyCascadeAction(originalForeignKey?.deletion_action)
  const updatedDeletionAction = getForeignKeyCascadeAction(updatedForeignKey?.deletion_action)

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
            </div>
            <div className="flex items-center space-x-2">
              {originalDeletionAction !== updatedDeletionAction && (
                <>
                  <Badge color="gray" className="line-through">
                    On delete: {originalDeletionAction ?? 'No action'}
                  </Badge>
                  <Badge color="green">On delete: {updatedDeletionAction ?? 'No action'}</Badge>
                </>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {originalUpdateAction !== updatedUpdateAction && (
                <>
                  <Badge color="gray" className="line-through">
                    On update: {originalUpdateAction ?? 'No action'}
                  </Badge>
                  <Badge color="green">On update: {updatedUpdateAction ?? 'No action'}</Badge>
                </>
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
