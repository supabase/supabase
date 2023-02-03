import { FC } from 'react'
import { isUndefined } from 'lodash'
import { Button, IconArrowRight } from 'ui'

import { ColumnField } from '../SidePanelEditor.types'
import InformationBox from 'components/ui/InformationBox'
import { getForeignKeyUIState } from './ColumnEditor.utils'
import type { PostgresRelationship } from '@supabase/postgres-meta'

interface Props {
  column: ColumnField
  originalForeignKey: PostgresRelationship | undefined
  onSelectEditRelation: () => void
  onSelectRemoveRelation: () => void
}

const ColumnForeignKey: FC<Props> = ({
  column,
  originalForeignKey,
  onSelectEditRelation = () => {},
  onSelectRemoveRelation = () => {},
}) => {
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

const ColumnForeignKeyInformation: FC<{
  columnName: string
  foreignKey?: PostgresRelationship
  onSelectEditRelation: () => void
  onSelectRemoveRelation: () => void
}> = ({ columnName, foreignKey, onSelectEditRelation, onSelectRemoveRelation }) => {
  return (
    <InformationBox
      block
      title={
        <div className="flex flex-col space-y-4 text-scale-900">
          <div className="space-y-2">
            <span>This column has the following foreign key relation:</span>
            <div className="flex items-center space-x-2">
              <span className="text-code">{columnName}</span>
              <IconArrowRight size={14} strokeWidth={2} />
              <span className="text-code">
                {foreignKey?.target_table_schema}.{foreignKey?.target_table_name}.
                {foreignKey?.target_column_name}
              </span>
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

const ColumnForeignKeyAdded: FC<{
  columnName: string
  foreignKey?: PostgresRelationship
  onSelectEditRelation: () => void
  onSelectRemoveRelation: () => void
}> = ({ columnName, foreignKey, onSelectEditRelation, onSelectRemoveRelation }) => {
  return (
    <InformationBox
      block
      title={
        <div className="flex flex-col space-y-4 text-scale-1100">
          <div className="space-y-2">
            <span>
              The following foreign key relation will be{' '}
              <span className="text-brand-900">added</span>:
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

const ColumnForeignKeyRemoved: FC<{
  columnName: string
  originalForeignKey?: PostgresRelationship
  onSelectEditRelation: () => void
}> = ({ columnName, originalForeignKey, onSelectEditRelation }) => {
  return (
    <InformationBox
      block
      title={
        <div className="flex flex-col space-y-4">
          <div className="space-y-2">
            <p>
              The following foreign key relation will be{' '}
              <span className="text-amber-900">removed</span> from this column:
            </p>
            <div className="flex items-center space-x-2">
              <code className="text-sm">{columnName}</code>
              <IconArrowRight size={14} strokeWidth={2} />
              <code className="text-sm">
                {originalForeignKey?.target_table_schema}.{originalForeignKey?.target_table_name}.
                {originalForeignKey?.target_column_name}
              </code>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button type="outline" onClick={onSelectEditRelation}>
              Edit relation
            </Button>
          </div>
        </div>
      }
    />
  )
}

const ColumnForeignKeyUpdated: FC<{
  columnName: string
  originalForeignKey?: PostgresRelationship
  updatedForeignKey?: PostgresRelationship
  onSelectEditRelation: () => void
  onSelectRemoveRelation: () => void
}> = ({
  columnName,
  originalForeignKey,
  updatedForeignKey,
  onSelectEditRelation,
  onSelectRemoveRelation,
}) => {
  return (
    <InformationBox
      block
      title={
        <div className="flex flex-col space-y-4">
          <div className="space-y-2">
            <p>
              The foreign key relation will be <span className="text-brand-900">updated</span> as
              such:
            </p>
            <div className="flex items-start space-x-2">
              <code className="text-sm">{columnName}</code>
              <IconArrowRight className="mt-1" size={14} strokeWidth={2} />
              <div className="flex flex-col space-y-2">
                <p className="line-through">
                  <code className="text-sm">
                    {originalForeignKey?.target_table_schema}.
                    {originalForeignKey?.target_table_name}.{originalForeignKey?.target_column_name}
                  </code>
                </p>
                <code className="text-sm">
                  {updatedForeignKey?.target_table_schema}.{updatedForeignKey?.target_table_name}.
                  {updatedForeignKey?.target_column_name}
                </code>
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
