import { FC, useEffect, useState } from 'react'
import { isUndefined, isEmpty } from 'lodash'
import { Badge, Checkbox, Divider, SidePanel, Space, Input, Typography } from '@supabase/ui'
import { PostgresTable } from '@supabase/postgres-meta'

import { useStore } from 'hooks'
import ActionBar from '../ActionBar'
import HeaderTitle from './HeaderTitle'
import ColumnManagement from './ColumnManagement'
import SpreadsheetImport from './SpreadsheetImport/SpreadsheetImport'
import {
  ColumnField,
  EnumType,
  CreateTablePayload,
  UpdateTablePayload,
} from '../SidePanelEditor.types'
import { DEFAULT_COLUMNS } from './TableEditor.constants'
import { TableField, ImportContent } from './TableEditor.types'
import {
  validateFields,
  generateTableField,
  generateTableFieldFromPostgresTable,
  formatImportedContentToColumnFields,
} from './TableEditor.utils'

interface Props {
  table?: PostgresTable
  tables: PostgresTable[]
  enumTypes: EnumType[]
  selectedSchema: string
  isDuplicating: boolean
  visible: boolean
  closePanel: () => void
  saveChanges: (
    payload: any,
    columns: ColumnField[],
    isNewRecord: boolean,
    configuration: {
      tableId?: number
      importContent?: ImportContent
      isRLSEnabled: boolean
      isDuplicateRows: boolean
    },
    resolve: any
  ) => void
  updateEditorDirty: () => void
}

const TableEditor: FC<Props> = ({
  table,
  tables = [],
  enumTypes = [] as EnumType[],
  selectedSchema,
  isDuplicating,
  visible = false,
  closePanel = () => {},
  saveChanges = () => {},
  updateEditorDirty = () => {},
}) => {
  const { ui } = useStore()
  const isNewRecord = isUndefined(table)

  const [errors, setErrors] = useState<any>({})
  const [tableFields, setTableFields] = useState<TableField>()
  const [isDuplicateRows, setIsDuplicateRows] = useState<boolean>(false)
  const [importContent, setImportContent] = useState<ImportContent>()
  const [isImportingSpreadsheet, setIsImportingSpreadsheet] = useState<boolean>(false)

  useEffect(() => {
    if (visible) {
      setErrors({})
      setImportContent(undefined)
      setIsDuplicateRows(false)
      if (isNewRecord) {
        const tableFields = generateTableField()
        setTableFields(tableFields)
      } else {
        const tableFields = generateTableFieldFromPostgresTable(table!, isDuplicating)
        setTableFields(tableFields)
      }
    }
  }, [visible])

  useEffect(() => {
    if (importContent && !isEmpty(importContent)) {
      const importedColumns = formatImportedContentToColumnFields(importContent)
      onUpdateField({ columns: importedColumns })
    }
  }, [importContent])

  const onUpdateField = (changes: Partial<TableField>) => {
    const updatedTableFields = { ...tableFields, ...changes } as TableField
    setTableFields(updatedTableFields)
    updateEditorDirty()

    const updatedErrors = { ...errors }
    for (const key of Object.keys(changes)) {
      delete updatedErrors[key]
    }
    setErrors(updatedErrors)
  }

  const onSaveChanges = (resolve: any) => {
    if (tableFields) {
      const errors: any = validateFields(tableFields)
      if (errors.columns) {
        ui.setNotification({ category: 'error', message: errors.columns })
      }
      setErrors(errors)

      if (isEmpty(errors)) {
        const payload: CreateTablePayload | UpdateTablePayload = {
          name: tableFields.name,
          comment: tableFields.comment,
          ...(!isNewRecord && { rls_enabled: tableFields.isRLSEnabled }),
        }
        const configuration = {
          tableId: table?.id,
          importContent,
          isRLSEnabled: tableFields.isRLSEnabled,
          isDuplicateRows: isDuplicateRows,
        }
        saveChanges(payload, tableFields.columns, isNewRecord, configuration, resolve)
      } else {
        resolve()
      }
    }
  }

  if (!tableFields) return null

  return (
    <SidePanel
      wide
      key="TableEditor"
      visible={visible}
      // @ts-ignore
      title={<HeaderTitle table={table} isDuplicating={isDuplicating} />}
      className={`transition-all ease-in duration-100 ${isImportingSpreadsheet ? ' mr-32' : ''}`}
      onCancel={closePanel}
      onConfirm={(resolve: () => void) => onSaveChanges(resolve)}
      customFooter={
        <ActionBar
          backButtonLabel="Cancel"
          applyButtonLabel="Save"
          closePanel={closePanel}
          applyFunction={(resolve: () => void) => onSaveChanges(resolve)}
        />
      }
    >
      <Space direction="vertical" size={6} style={{ width: '100%' }}>
        <Input
          label="Name"
          layout="horizontal"
          type="text"
          error={errors.name}
          value={tableFields?.name}
          onChange={(event: any) => onUpdateField({ name: event.target.value })}
        />
        <Input
          label="Description"
          placeholder="Optional"
          layout="horizontal"
          type="text"
          value={tableFields?.comment ?? ''}
          onChange={(event: any) => onUpdateField({ comment: event.target.value })}
        />
        <div />
        <Checkbox
          id="enable-rls"
          // @ts-ignore
          label={
            <div className="flex items-center space-x-2">
              <Typography.Text>Enable Row Level Security (RLS)</Typography.Text>
              <Badge color="green">Recommended</Badge>
            </div>
          }
          description="Restrict access to your table by enabling RLS and writing Postgres policies. If RLS is not enabled, anyone with the anon key can modify and delete your data."
          checked={tableFields?.isRLSEnabled}
          onChange={() => onUpdateField({ isRLSEnabled: !tableFields?.isRLSEnabled })}
          size="medium"
        />
        <Divider light />
        {!isDuplicating && (
          <ColumnManagement
            table={{ name: tableFields.name, schema: selectedSchema }}
            tables={tables}
            columns={tableFields?.columns}
            enumTypes={enumTypes}
            isNewRecord={isNewRecord}
            importContent={importContent}
            onColumnsUpdated={(columns) => onUpdateField({ columns })}
            onSelectImportData={() => setIsImportingSpreadsheet(true)}
            onClearImportContent={() => {
              onUpdateField({ columns: DEFAULT_COLUMNS })
              setImportContent(undefined)
            }}
          />
        )}
        {isDuplicating && (
          <>
            <Checkbox
              id="duplicate-rows"
              label="Duplicate table entries"
              description="This will copy all the data in the table into the new table"
              checked={isDuplicateRows}
              onChange={() => setIsDuplicateRows(!isDuplicateRows)}
              size="medium"
            />
          </>
        )}
      </Space>
      <SpreadsheetImport
        visible={isImportingSpreadsheet}
        headers={importContent?.headers}
        rows={importContent?.rows}
        saveContent={(prefillData: ImportContent) => {
          setImportContent(prefillData)
          setIsImportingSpreadsheet(false)
        }}
        closePanel={() => setIsImportingSpreadsheet(false)}
      />
    </SidePanel>
  )
}

export default TableEditor
