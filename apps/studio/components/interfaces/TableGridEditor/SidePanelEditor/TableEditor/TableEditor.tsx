import type { PostgresTable } from '@supabase/postgres-meta'
import { isEmpty, isUndefined, noop } from 'lodash'
import { useContext, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import type { GeneratedPolicy } from 'components/interfaces/Auth/Policies/Policies.utils'
import { useDatabasePublicationsQuery } from 'data/database-publications/database-publications-query'
import { CONSTRAINT_TYPE, useTableConstraintsQuery } from 'data/database/constraints-query'
import { useForeignKeyConstraintsQuery } from 'data/database/foreign-key-constraints-query'
import { useEnumeratedTypesQuery } from 'data/enumerated-types/enumerated-types-query'
import { useChanged } from 'hooks/misc/useChanged'
import { useQuerySchemaState } from 'hooks/misc/useSchemaQueryState'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useUrlState } from 'hooks/ui/useUrlState'
import { useProtectedSchemas } from 'hooks/useProtectedSchemas'
import { type PlainObject } from 'lib/type-helpers'
import { TableEditorStateContext, useTableEditorStateSnapshot } from 'state/table-editor'
import { Checkbox, Input, SidePanel } from 'ui'
import { ActionBar } from '../ActionBar'
import type { ForeignKey } from '../ForeignKeySelector/ForeignKeySelector.types'
import { formatForeignKeys } from '../ForeignKeySelector/ForeignKeySelector.utils'
import type { SaveTableParams } from '../SidePanelEditor'
import type { ColumnField } from '../SidePanelEditor.types'
import { SpreadsheetImport } from '../SpreadsheetImport/SpreadsheetImport'
import ColumnManagement from './ColumnManagement'
import { ForeignKeysManagement } from './ForeignKeysManagement/ForeignKeysManagement'
import { HeaderTitle } from './HeaderTitle'
import { RLSManagement } from './RLSManagement/RLSManagement'
import { DEFAULT_COLUMNS } from './TableEditor.constants'
import type { ImportContent, TableField } from './TableEditor.types'
import {
  formatImportedContentToColumnFields,
  generateTableField,
  generateTableFieldFromPostgresTable,
  validateFields,
} from './TableEditor.utils'

type SaveTableParamsFor<Action extends SaveTableParams['action']> = Extract<
  SaveTableParams,
  { action: Action }
>

type SaveTablePayloadFor<Action extends SaveTableParams['action']> =
  SaveTableParamsFor<Action>['payload']

export interface TableEditorProps {
  table?: PostgresTable
  isDuplicating: boolean
  templateData?: Partial<TableField>
  visible: boolean
  closePanel: () => void
  saveChanges: (params: SaveTableParams) => void
  updateEditorDirty: () => void
}

export const TableEditor = ({
  table,
  isDuplicating,
  templateData,
  visible = false,
  closePanel = noop,
  saveChanges = noop,
  updateEditorDirty = noop,
}: TableEditorProps) => {
  const tableEditorApi = useContext(TableEditorStateContext)
  const snap = useTableEditorStateSnapshot()

  const { data: project } = useSelectedProjectQuery()
  const { selectedSchema } = useQuerySchemaState()
  const isNewRecord = isUndefined(table)

  const [params, setParams] = useUrlState()
  useEffect(() => {
    if (params.create === 'table' && snap.ui.open === 'none') {
      tableEditorApi.onAddTable()
      setParams({ ...params, create: undefined })
    }
  }, [tableEditorApi, setParams, snap.ui.open, params])

  const { data: types } = useEnumeratedTypesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const { data: protectedSchemas } = useProtectedSchemas({ excludeSchemas: ['extensions'] })
  const enumTypes = (types ?? []).filter(
    (type) => !protectedSchemas.find((s) => s.name === type.schema)
  )

  const { data: publications } = useDatabasePublicationsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const isRealtimeEnabled = false
  const [errors, setErrors] = useState<PlainObject>({})
  const [tableFields, setTableFields] = useState<TableField>()
  const [fkRelations, setFkRelations] = useState<ForeignKey[]>([])

  const [isDuplicateRows, setIsDuplicateRows] = useState<boolean>(false)
  const [importContent, setImportContent] = useState<ImportContent>()
  const [isImportingSpreadsheet, setIsImportingSpreadsheet] = useState<boolean>(false)

  const [generatedPolicies, setGeneratedPolicies] = useState<GeneratedPolicy[]>([])

  const { data: constraints } = useTableConstraintsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    id: table?.id,
  })
  const primaryKey = (constraints ?? []).find(
    (constraint) => constraint.type === CONSTRAINT_TYPE.PRIMARY_KEY_CONSTRAINT
  )

  const { data: foreignKeyMeta, isSuccess: isSuccessForeignKeyMeta } =
    useForeignKeyConstraintsQuery(
      {
        projectRef: project?.ref,
        connectionString: project?.connectionString,
        schema: table?.schema,
      },
      {
        enabled: !isNewRecord && !!table?.schema,
      }
    )
  const foreignKeys = useMemo(
    () =>
      (foreignKeyMeta ?? []).filter(
        (fk) => fk.source_schema === table?.schema && fk.source_table === table?.name
      ),
    [foreignKeyMeta, table]
  )

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

  const onUpdateFkRelations = (relations: ForeignKey[]) => {
    if (tableFields === undefined) return
    const updatedColumns: ColumnField[] = []

    relations.forEach((relation) => {
      relation.columns.forEach((column) => {
        const sourceColumn = tableFields.columns.find((col) => col.name === column.source)
        if (sourceColumn?.isNewColumn && column.targetType) {
          updatedColumns.push({ ...sourceColumn, format: column.targetType })
        }
      })
    })

    if (updatedColumns.length > 0) {
      const updatedTableFields = {
        ...tableFields,
        columns: tableFields.columns.map((col) => {
          const updatedColumn = updatedColumns.find((x) => x.id === col.id)
          if (updatedColumn) return updatedColumn
          else return col
        }),
      }
      setTableFields(updatedTableFields)
    }
    setFkRelations(relations)
  }

  const onSaveChanges = async (resolve: () => void) => {
    if (tableFields) {
      const errors = validateFields(tableFields)
      if (errors.name) {
        toast.error(errors.name)
      }
      if (errors.columns) {
        toast.error(errors.columns)
      }
      setErrors(errors)

      const isNameChanged = tableFields.name.trim() !== table?.name
      const isCommentChanged = tableFields.comment !== table?.comment
      const isRlsEnabledChanged = tableFields.isRLSEnabled !== (table?.rls_enabled ?? false)

      if (isEmpty(errors)) {
        const payload: any = {
          name: tableFields.name.trim(),
          comment: tableFields.comment?.trim(),
        }

        if (isNewRecord) {
          payload.schema = selectedSchema
        } else if (!isDuplicating) {
          // Update mode: only include changed fields
          if (!isNameChanged) delete payload.name
          if (!isCommentChanged) delete payload.comment
          if (isRlsEnabledChanged) payload.rls_enabled = tableFields.isRLSEnabled
        }

        const configuration = {
          tableId: table?.id,
          importContent,
          isRLSEnabled: tableFields.isRLSEnabled,
          isRealtimeEnabled: tableFields.isRealtimeEnabled,
          isDuplicateRows: isDuplicateRows,
          existingForeignKeyRelations: foreignKeys,
          primaryKey,
        }

        const columns = tableFields.columns.map((column) => ({
          ...column,
          name: column.name.trim(),
        }))

        const action = isNewRecord ? 'create' : isDuplicating ? 'duplicate' : 'update'

        saveChanges({
          action: action as any,
          payload,
          configuration,
          columns,
          foreignKeyRelations: fkRelations,
          resolve,
          generatedPolicies: isNewRecord ? generatedPolicies : [],
        })
      } else {
        resolve()
      }
    }
  }

  const visibleChanged = useChanged(visible)
  useEffect(() => {
    if (visibleChanged && visible) {
      setErrors({})
      setImportContent(undefined)
      setIsDuplicateRows(false)
      setGeneratedPolicies([])
      if (isNewRecord) {
        const tableFields = generateTableField()
        if (templateData) {
          setTableFields({ ...tableFields, ...templateData })
        } else {
          setTableFields(tableFields)
        }
        setFkRelations([])
      } else {
        const tableFields = generateTableFieldFromPostgresTable(
          table,
          foreignKeyMeta ?? [],
          isDuplicating,
          isRealtimeEnabled
        )
        setTableFields(tableFields)
      }
    }
  }, [
    visible,
    templateData,
    foreignKeyMeta,
    isRealtimeEnabled,
    isNewRecord,
    isDuplicating,
    table,
    visibleChanged,
  ])

  useEffect(() => {
    if (!isNewRecord) {
      const tableFields = generateTableFieldFromPostgresTable(
        table,
        foreignKeyMeta ?? [],
        isDuplicating,
        isRealtimeEnabled
      )
      setTableFields(tableFields)
    }
  }, [isNewRecord, table, foreignKeyMeta, isDuplicating, isRealtimeEnabled])

  useEffect(() => {
    if (isSuccessForeignKeyMeta) setFkRelations(formatForeignKeys(foreignKeys))
  }, [isSuccessForeignKeyMeta, foreignKeys])

  useEffect(() => {
    if (importContent && !isEmpty(importContent)) {
      const importedColumns = formatImportedContentToColumnFields(importContent)
      onUpdateField({ columns: importedColumns })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [importContent])

  if (!tableFields) return null

  return (
    <SidePanel
      data-testid="table-editor-side-panel"
      size="large"
      key="TableEditor"
      visible={visible}
      header={<HeaderTitle schema={selectedSchema} table={table} isDuplicating={isDuplicating} />}
      className={`transition-all duration-100 ease-in ${isImportingSpreadsheet ? ' mr-32' : ''}`}
      onCancel={closePanel}
      onConfirm={() => (resolve: () => void) => onSaveChanges(resolve)}
      customFooter={
        <ActionBar
          backButtonLabel="Cancel"
          applyButtonLabel="Save"
          closePanel={closePanel}
          applyFunction={(resolve: () => void) => onSaveChanges(resolve)}
        />
      }
    >
      <SidePanel.Content className="space-y-10 py-6">
        <Input
          data-testid="table-name-input"
          label="Name"
          layout="horizontal"
          type="text"
          error={errors.name ? String(errors.name) : undefined}
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
      </SidePanel.Content>

      <SidePanel.Separator />

      <SidePanel.Content className="space-y-10 py-6">
        {!isDuplicating && (
          <ColumnManagement
            table={tableFields}
            columns={tableFields?.columns}
            relations={fkRelations}
            enumTypes={enumTypes}
            isNewRecord={isNewRecord}
            importContent={importContent}
            onColumnsUpdated={(columns) => onUpdateField({ columns })}
            onSelectImportData={() => setIsImportingSpreadsheet(true)}
            onClearImportContent={() => {
              onUpdateField({ columns: DEFAULT_COLUMNS })
              setImportContent(undefined)
            }}
            onUpdateFkRelations={onUpdateFkRelations}
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
      </SidePanel.Content>

      {!isDuplicating && (
        <>
          <SidePanel.Separator />
          <SidePanel.Content className="py-6">
            <ForeignKeysManagement
              table={tableFields}
              relations={fkRelations}
              closePanel={closePanel}
              setEditorDirty={() => updateEditorDirty()}
              onUpdateFkRelations={onUpdateFkRelations}
            />
          </SidePanel.Content>
        </>
      )}

      <SidePanel.Separator />

      <SidePanel.Content className="space-y-10 py-6">
        <RLSManagement
          schema={table?.schema ?? selectedSchema ?? ''}
          table={table}
          tableName={isNewRecord ? tableFields.name : undefined}
          columns={isNewRecord ? tableFields.columns : undefined}
          foreignKeyRelations={isNewRecord ? fkRelations : undefined}
          isRlsEnabled={tableFields.isRLSEnabled}
          onChangeRlsEnabled={(value) => onUpdateField({ isRLSEnabled: value })}
          isNewRecord={isNewRecord}
          isDuplicating={isDuplicating}
          generatedPolicies={generatedPolicies}
          onGeneratedPoliciesChange={setGeneratedPolicies}
        />
      </SidePanel.Content>
    </SidePanel>
  )
}
