import type { PostgresTable } from '@supabase/postgres-meta'
import { isEmpty, noop, partition } from 'lodash'
import { useEffect, useMemo, useState } from 'react'
import type { Dictionary } from 'types'
import { SidePanel } from 'ui'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useForeignKeyConstraintsQuery } from 'data/database/foreign-key-constraints-query'
import ActionBar from '../ActionBar'
import ForeignRowSelector from './ForeignRowSelector/ForeignRowSelector'
import HeaderTitle from './HeaderTitle'
import InputField from './InputField'
import { JsonEditor } from './JsonEditor'
import type { EditValue, RowField } from './RowEditor.types'
import {
  generateRowFields,
  generateRowObjectFromFields,
  generateUpdateRowPayload,
  validateFields,
} from './RowEditor.utils'
import { TextEditor } from './TextEditor'

export interface RowEditorProps {
  row?: Dictionary<any>
  selectedTable: PostgresTable
  visible: boolean
  closePanel: () => void
  saveChanges: (payload: any, isNewRecord: boolean, configuration: any, resolve: () => void) => void
  updateEditorDirty: () => void
}

const RowEditor = ({
  row,
  selectedTable,
  visible = false,
  closePanel = noop,
  saveChanges = noop,
  updateEditorDirty = noop,
}: RowEditorProps) => {
  const [errors, setErrors] = useState<Dictionary<any>>({})
  const [rowFields, setRowFields] = useState<any[]>([])

  const [selectedValueForTextEdit, setSelectedValueForTextEdit] = useState<EditValue>()
  const [selectedValueForJsonEdit, setSelectedValueForJsonEdit] = useState<EditValue>()

  const [isSelectingForeignKey, setIsSelectingForeignKey] = useState<boolean>(false)
  const [referenceRow, setReferenceRow] = useState<RowField>()

  const isNewRecord = row === undefined
  const isEditingText = selectedValueForTextEdit !== undefined
  const isEditingJson = selectedValueForJsonEdit !== undefined

  const [loading, setLoading] = useState(false)

  const [requiredFields, optionalFields] = partition(
    rowFields,
    (rowField: any) => !rowField.isNullable
  )

  const { project } = useProjectContext()
  const { data } = useForeignKeyConstraintsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    schema: selectedTable.schema,
  })

  const foreignKey = useMemo(
    () =>
      data && referenceRow?.foreignKey?.id
        ? data.find((key) => key.id === referenceRow.foreignKey?.id)
        : undefined,
    [data, referenceRow?.foreignKey?.id]
  )

  useEffect(() => {
    if (visible) {
      setErrors({})
      const rowFields = generateRowFields(row, selectedTable)
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

  const onOpenForeignRowSelector = async (row: RowField) => {
    setIsSelectingForeignKey(true)
    setReferenceRow(row)
  }

  const onSelectForeignRowValue = (value: any) => {
    if (!referenceRow) return

    onUpdateField({ [referenceRow.name]: value })

    setIsSelectingForeignKey(false)
    setReferenceRow(undefined)
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
      hideFooter
      size="large"
      key="RowEditor"
      visible={visible}
      header={<HeaderTitle isNewRecord={isNewRecord} tableName={selectedTable.name} />}
      className={`transition-all duration-100 ease-in ${
        isEditingText || isEditingJson || isSelectingForeignKey ? ' mr-32' : ''
      }`}
      onCancel={closePanel}
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
                      onSelectForeignKey={() => onOpenForeignRowSelector(field)}
                    />
                  )
                })}
              </div>
            </SidePanel.Content>
            {optionalFields.length > 0 && (
              <>
                <SidePanel.Separator />
                <SidePanel.Content>
                  <div className="space-y-10 py-6">
                    <div>
                      <h3 className="text-base text-foreground">Optional Fields</h3>
                      <p className="text-sm text-foreground-lighter">
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
                          onEditText={setSelectedValueForTextEdit}
                          onEditJson={setSelectedValueForJsonEdit}
                          onSelectForeignKey={() => onOpenForeignRowSelector(field)}
                        />
                      )
                    })}
                  </div>
                </SidePanel.Content>
              </>
            )}

            <TextEditor
              visible={isEditingText}
              row={row}
              column={selectedValueForTextEdit?.column ?? ''}
              closePanel={() => setSelectedValueForTextEdit(undefined)}
              onSaveField={(value) => {
                onUpdateField({ [selectedValueForTextEdit?.column ?? '']: value })
                setSelectedValueForTextEdit(undefined)
              }}
            />
            <JsonEditor
              visible={isEditingJson}
              row={row}
              column={selectedValueForJsonEdit?.column ?? ''}
              jsonString={selectedValueForJsonEdit?.value ?? ''}
              closePanel={() => setSelectedValueForJsonEdit(undefined)}
              onSaveJSON={(value) => {
                onUpdateField({ [selectedValueForJsonEdit?.column ?? '']: value })
                setSelectedValueForJsonEdit(undefined)
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

      <ForeignRowSelector
        key={`foreign-row-selector-${foreignKey?.id ?? 'null'}`}
        visible={isSelectingForeignKey}
        foreignKey={foreignKey}
        onSelect={onSelectForeignRowValue}
        closePanel={() => {
          setIsSelectingForeignKey(false)
          setReferenceRow(undefined)
        }}
      />
    </SidePanel>
  )
}

export default RowEditor
