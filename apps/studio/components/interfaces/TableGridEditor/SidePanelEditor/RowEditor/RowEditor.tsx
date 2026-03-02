import type { PostgresTable } from '@supabase/postgres-meta'
import { useForeignKeyConstraintsQuery } from 'data/database/foreign-key-constraints-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { isEmpty, noop, partition } from 'lodash'
import { useEffect, useMemo, useState } from 'react'
import type { Dictionary } from 'types'
import { SidePanel, Toggle } from 'ui'

import { ActionBar } from '../ActionBar'
import { formatForeignKeys } from '../ForeignKeySelector/ForeignKeySelector.utils'
import { ForeignRowSelector } from './ForeignRowSelector/ForeignRowSelector'
import { HeaderTitle } from './HeaderTitle'
import { InputField } from './InputField'
import { JsonEditor } from './JsonEditor'
import type { EditValue, RowField } from './RowEditor.types'
import {
  convertByteaToHex,
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
  editable?: boolean
  closePanel: () => void
  saveChanges: (payload: any, isNewRecord: boolean, configuration: any, resolve: () => void) => void
  updateEditorDirty: () => void
}

const formId = 'row-editor-panel'

export const RowEditor = ({
  row,
  selectedTable,
  visible = false,
  editable = true,
  closePanel = noop,
  saveChanges = noop,
  updateEditorDirty = noop,
}: RowEditorProps) => {
  const [errors, setErrors] = useState<Dictionary<any>>({})
  const [rowFields, setRowFields] = useState<RowField[]>([])

  const [selectedValueForTextEdit, setSelectedValueForTextEdit] = useState<EditValue>()
  const [selectedValueForJsonEdit, setSelectedValueForJsonEdit] = useState<EditValue>()

  const [isSelectingForeignKey, setIsSelectingForeignKey] = useState<boolean>(false)
  const [referenceRow, setReferenceRow] = useState<RowField>()

  const isNewRecord = row === undefined
  const isEditingText = selectedValueForTextEdit !== undefined
  const isEditingJson = selectedValueForJsonEdit !== undefined

  const [loading, setLoading] = useState(false)
  const [createMore, setCreateMore] = useState(false)

  const [requiredFields, optionalFields] = partition(
    rowFields,
    (rowField: any) => !rowField.isNullable
  )

  const { data: project } = useSelectedProjectQuery()
  const { data } = useForeignKeyConstraintsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    schema: selectedTable.schema,
  })
  const foreignKeys = formatForeignKeys(
    (data ?? []).filter(
      (fk) => fk.source_schema === selectedTable?.schema && fk.source_table === selectedTable?.name
    )
  )
  const foreignKey = useMemo(
    () =>
      foreignKeys && referenceRow?.foreignKey?.id
        ? foreignKeys.find((key) => key.id === referenceRow.foreignKey?.id)
        : undefined,
    [foreignKeys, referenceRow?.foreignKey?.id]
  )

  useEffect(() => {
    if (visible) {
      setErrors({})
      const rowFields = generateRowFields(row, selectedTable, foreignKeys)
      setRowFields(rowFields)
    }
  }, [visible])

  const onUpdateField = (changes: Dictionary<any>) => {
    const updatedProperties = Object.keys(changes)
    const updatedFields = rowFields.map((field) => {
      if (updatedProperties.includes(field.name)) {
        return { ...field, value: changes[field.name] }
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

  const onSelectForeignRowValue = (value?: { [key: string]: any }) => {
    if (referenceRow !== undefined && value !== undefined) {
      onUpdateField(value)
    }

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
        primaryKeyColumns.forEach((column) => {
          identifiers[column.name] =
            column.format === 'bytea' ? convertByteaToHex(row![column.name]) : row![column.name]
        })
        configuration.identifiers = identifiers
        configuration.rowIdx = row!.idx
      }

      saveChanges(payload, isNewRecord, { ...configuration, createMore }, (err?: any) => {
        setLoading(false)
        if (!err && createMore && isNewRecord) {
          const freshFields = generateRowFields(undefined, selectedTable, foreignKeys)
          setRowFields(freshFields)
          setErrors({})
        }
      })
    } else {
      setLoading(false)
    }
  }

  // Transform the rowFields to a dictionary of column names to values. Used to pass to the TextEditor
  const editedRow = useMemo(() => {
    return rowFields.reduce((acc, field) => {
      acc[field.name] = field.value
      return acc
    }, {} as Dictionary<any>)
  }, [rowFields])

  return (
    <SidePanel
      data-testid="side-panel-row-editor"
      // hideFooter
      size="large"
      key="RowEditor"
      visible={visible}
      header={<HeaderTitle isNewRecord={isNewRecord} tableName={selectedTable.name} />}
      className={`transition-all duration-100 ease-in ${
        isEditingText || isEditingJson || isSelectingForeignKey ? ' mr-32' : ''
      }`}
      onCancel={closePanel}
      customFooter={
        <ActionBar
          loading={loading}
          formId={formId}
          backButtonLabel="Cancel"
          applyButtonLabel="Save"
          closePanel={closePanel}
          hideApply={!editable}
          visible={visible}
        >
          {isNewRecord && editable && (
            <div className="flex items-center gap-x-2">
              <Toggle
                size="tiny"
                checked={createMore}
                onChange={() => setCreateMore(!createMore)}
              />
              <label
                className="text-foreground-light text-sm cursor-pointer select-none"
                onClick={() => setCreateMore(!createMore)}
              >
                Create more
              </label>
            </div>
          )}
        </ActionBar>
      }
    >
      <form id={formId} onSubmit={(e) => onSaveChanges(e)} className="h-full">
        <div className="flex h-full flex-col">
          <div className="flex flex-grow flex-col">
            {requiredFields.length > 0 && (
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
                        onEditText={setSelectedValueForTextEdit}
                        onSelectForeignKey={() => onOpenForeignRowSelector(field)}
                        isEditable={editable}
                      />
                    )
                  })}
                </div>
              </SidePanel.Content>
            )}
            {optionalFields.length > 0 && (
              <>
                {requiredFields.length > 0 && <SidePanel.Separator />}
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
                          isEditable={editable}
                        />
                      )
                    })}
                  </div>
                </SidePanel.Content>
              </>
            )}

            <TextEditor
              visible={isEditingText}
              row={editedRow}
              column={selectedValueForTextEdit?.column ?? ''}
              closePanel={() => setSelectedValueForTextEdit(undefined)}
              onSaveField={(value) => {
                onUpdateField({ [selectedValueForTextEdit?.column ?? '']: value })
                setSelectedValueForTextEdit(undefined)
              }}
              readOnly={!editable}
            />
            <JsonEditor
              visible={isEditingJson}
              row={editedRow}
              column={selectedValueForJsonEdit?.column ?? ''}
              closePanel={() => setSelectedValueForJsonEdit(undefined)}
              onSaveJSON={(value) => {
                onUpdateField({ [selectedValueForJsonEdit?.column ?? '']: value })
                setSelectedValueForJsonEdit(undefined)
              }}
              readOnly={!editable}
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
