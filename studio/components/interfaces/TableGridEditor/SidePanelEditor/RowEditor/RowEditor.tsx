import { FC, useEffect, useState } from 'react'
import { isUndefined, partition, isEmpty } from 'lodash'
import { SidePanel } from '@supabase/ui'
import { Dictionary } from 'components/grid'
import { Query } from 'components/grid/query/Query'
import { PostgresTable } from '@supabase/postgres-meta'

import { useStore } from 'hooks'
import ActionBar from '../ActionBar'
import HeaderTitle from './HeaderTitle'
import InputField from './InputField'
import JsonEdit from './JsonEditor'
import ReferenceRowViewer from './ReferenceRowViewer'
import {
  generateRowFields,
  validateFields,
  generateRowObjectFromFields,
  generateUpdateRowPayload,
} from './RowEditor.utils'
import { JsonEditValue, ReferenceRow, RowField } from './RowEditor.types'

interface Props {
  row?: Dictionary<any>
  selectedTable: PostgresTable
  visible: boolean
  closePanel: () => void
  saveChanges: (payload: any, isNewRecord: boolean, configuration: any, resolve: () => void) => void
  updateEditorDirty: () => void
}

const RowEditor: FC<Props> = ({
  row,
  selectedTable,
  visible = false,
  closePanel = () => {},
  saveChanges = () => {},
  updateEditorDirty = () => {},
}) => {
  const { meta, ui } = useStore()
  const [errors, setErrors] = useState<Dictionary<any>>({})
  const [rowFields, setRowFields] = useState<any[]>([])
  const [selectedValueForJsonEdit, setSelectedValueForJsonEdit] = useState<JsonEditValue>()

  const [isViewingReferenceRow, setIsViewingReferenceRow] = useState<boolean>(false)
  const [referenceRow, setReferenceRow] = useState<ReferenceRow>()

  const isNewRecord = isUndefined(row)
  const isEditingJson = !isUndefined(selectedValueForJsonEdit)

  const [loading, setLoading] = useState(false)

  const [requiredFields, optionalFields] = partition(
    rowFields,
    (rowField: any) => !rowField.isNullable
  )

  useEffect(() => {
    if (visible) {
      setErrors({})
      const rowFields = generateRowFields(row, selectedTable, isNewRecord)
      setRowFields(rowFields)
    }
  }, [visible])

  const onUpdateField = (changes: Dictionary<any>) => {
    const [name] = Object.keys(changes)
    const updatedFields = rowFields.map((field) => {
      if (field.name === name) {
        return { ...field, value: changes[name] }
      } else {
        return field
      }
    })
    setRowFields(updatedFields)
    updateEditorDirty()
  }

  const onViewForeignKey = async (row: RowField) => {
    // Possible low prio refactor: Shift fetching reference row retrieval to ReferenceRowViewer
    // in a useEffect, rather than trying to manage a loading state in this method
    if (!row.value) {
      ui.setNotification({
        category: 'error',
        message: `Please enter a value in the ${row.name} field first`,
        duration: 4000,
      })
    }
    const foreignKey = row.foreignKey
    setReferenceRow({ loading: true, foreignKey, row: undefined })
    setIsViewingReferenceRow(true)

    if (foreignKey) {
      const schema = foreignKey.target_table_schema
      const table = foreignKey.target_table_name
      const column = foreignKey.target_column_name

      const query = new Query()
        .from(table, schema)
        .select()
        .match({ [column]: row.value })
        .toSql()
      const res = await meta.query(query)
      if (res.error) {
        setReferenceRow({ loading: false, foreignKey, row: undefined })
        return ui.setNotification({ category: 'error', message: res.error.message })
      }
      if (res.length === 0) {
        setReferenceRow({ loading: false, foreignKey, row: undefined })
        return ui.setNotification({
          category: 'error',
          message: `Unable to find the corresponding row in ${foreignKey.target_table_schema}.${foreignKey.target_table_name} where ${foreignKey.target_column_name} equals ${row.value}`,
          duration: 4000,
        })
      }
      setReferenceRow({ loading: false, foreignKey, row: res[0] })
    }
  }

  const onSaveChanges = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const errors = validateFields(rowFields)
    setErrors(errors)
    setLoading(true)

    if (isEmpty(errors)) {
      updateEditorDirty()

      const payload = isNewRecord
        ? generateRowObjectFromFields(rowFields)
        : generateUpdateRowPayload(row, rowFields)

      const configuration = { identifiers: {}, rowIdx: -1 }
      if (!isNewRecord) {
        const primaryKeyColumns = rowFields.filter((field) => field.isPrimaryKey)
        const identifiers = {} as Dictionary<any>
        primaryKeyColumns.forEach((column) => (identifiers[column.name] = row![column.name]))
        configuration.identifiers = identifiers
        configuration.rowIdx = row!.idx
      }

      saveChanges(payload, isNewRecord, configuration, () => setLoading(false))
    } else {
      setLoading(false)
    }
  }

  return (
    <SidePanel
      size="large"
      key="RowEditor"
      visible={visible}
      header={<HeaderTitle isNewRecord={isNewRecord} tableName={selectedTable.name} />}
      className={`transition-all duration-100 ease-in ${
        isEditingJson || isViewingReferenceRow ? ' mr-32' : ''
      }`}
      onCancel={closePanel}
      hideFooter
      onInteractOutside={(event) => {
        const isToast = (event.target as Element)?.closest('#toast')
        if (isToast) {
          event.preventDefault()
        }
      }}
    >
      <form onSubmit={(e) => onSaveChanges(e)} className="h-full">
        <div className="flex h-full flex-col">
          <div className="flex flex-grow flex-col">
            <SidePanel.Content>
              <div className="space-y-10 py-6">
                {requiredFields.map((field: RowField) => {
                  return (
                    <InputField
                      key={field.id}
                      field={field}
                      errors={errors}
                      onUpdateField={onUpdateField}
                      onEditJson={setSelectedValueForJsonEdit}
                      onViewForeignKey={() => onViewForeignKey(field)}
                    />
                  )
                })}
              </div>
            </SidePanel.Content>
            {optionalFields.length > 0 && (
              <>
                <SidePanel.Seperator />
                <SidePanel.Content>
                  <div className="space-y-10 py-6">
                    <div>
                      <h3 className="text-scale-1200 text-base">Optional Fields</h3>
                      <p className="text-scale-900 text-sm">
                        These are columns that do not need any value
                      </p>
                    </div>
                    {optionalFields.map((field: RowField) => {
                      return (
                        <InputField
                          key={field.id}
                          field={field}
                          errors={errors}
                          onUpdateField={onUpdateField}
                          onEditJson={setSelectedValueForJsonEdit}
                          onViewForeignKey={() => onViewForeignKey(field)}
                        />
                      )
                    })}
                  </div>
                </SidePanel.Content>
              </>
            )}

            <JsonEdit
              visible={isEditingJson}
              column={selectedValueForJsonEdit?.column ?? ''}
              jsonString={selectedValueForJsonEdit?.jsonString ?? ''}
              closePanel={() => setSelectedValueForJsonEdit(undefined)}
              onSaveJSON={(value: string | number) => {
                onUpdateField({ [selectedValueForJsonEdit?.column ?? '']: value })
                setSelectedValueForJsonEdit(undefined)
              }}
            />

            <ReferenceRowViewer
              visible={isViewingReferenceRow}
              referenceRow={referenceRow}
              closePanel={() => {
                setIsViewingReferenceRow(false)
                setReferenceRow(undefined)
              }}
            />
          </div>
          <div className="flex-shrink">
            <ActionBar
              loading={loading}
              backButtonLabel="Cancel"
              applyButtonLabel="Save"
              closePanel={closePanel}
            />
          </div>
        </div>
      </form>
    </SidePanel>
  )
}

export default RowEditor
