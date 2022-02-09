import { FC } from 'react'
import { isUndefined } from 'lodash'
import { Button, IconArrowRight, IconLink, Typography } from '@supabase/ui'

import { ColumnField } from '../SidePanelEditor.types'
import InformationBox from 'components/ui/InformationBox'
import { getForeignKeyUIState } from './ColumnEditor.utils'
import { PostgresRelationship } from '@supabase/postgres-meta'

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
      <div>
        <Button type="secondary" onClick={onSelectEditRelation}>
          Add foreign key relation
        </Button>
      </div>
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
      icon={<IconLink />}
      title={
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Typography.Text>This column has the following foreign key relation:</Typography.Text>
            <div className="flex items-center space-x-2">
              <Typography.Text code small>
                {columnName}
              </Typography.Text>
              <IconArrowRight size={14} strokeWidth={2} />
              <Typography.Text code small>
                {foreignKey?.target_table_schema}.{foreignKey?.target_table_name}.
                {foreignKey?.target_column_name}
              </Typography.Text>
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
      icon={<IconLink />}
      title={
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Typography.Text>
              The following foreign key relation will be{' '}
              <span className="text-green-500">added</span>:
            </Typography.Text>
            <div className="flex items-center space-x-2">
              <Typography.Text code small>
                {columnName}
              </Typography.Text>
              <IconArrowRight size={14} strokeWidth={2} />
              <Typography.Text code small>
                {foreignKey?.target_table_schema}.{foreignKey?.target_table_name}.
                {foreignKey?.target_column_name}
              </Typography.Text>
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
      icon={<IconLink />}
      title={
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Typography.Text>
              The following foreign key relation will be{' '}
              <span className="text-yellow-500">removed</span> from this column:
            </Typography.Text>
            <div className="flex items-center space-x-2">
              <Typography.Text code small>
                {columnName}
              </Typography.Text>
              <IconArrowRight size={14} strokeWidth={2} />
              <Typography.Text code small>
                {originalForeignKey?.target_table_schema}.{originalForeignKey?.target_table_name}.
                {originalForeignKey?.target_column_name}
              </Typography.Text>
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
      icon={<IconLink />}
      title={
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Typography.Text>
              The foreign key relation will be <span className="text-green-500">updated</span> as
              such:
            </Typography.Text>
            <div className="flex items-start space-x-2">
              <Typography.Text code small>
                {columnName}
              </Typography.Text>
              <IconArrowRight className="mt-1" size={14} strokeWidth={2} />
              <div className="flex flex-col space-y-2">
                <p className="line-through">
                  <Typography.Text code small>
                    {originalForeignKey?.target_table_schema}.
                    {originalForeignKey?.target_table_name}.{originalForeignKey?.target_column_name}
                  </Typography.Text>
                </p>
                <Typography.Text code small>
                  {updatedForeignKey?.target_table_schema}.{updatedForeignKey?.target_table_name}.
                  {updatedForeignKey?.target_column_name}
                </Typography.Text>
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
