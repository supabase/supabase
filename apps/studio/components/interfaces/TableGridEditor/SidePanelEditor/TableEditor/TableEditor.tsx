import type { PostgresTable } from '@supabase/postgres-meta'
import type { GeneratedPolicy } from 'components/interfaces/Auth/Policies/Policies.utils'
import { DocsButton } from 'components/ui/DocsButton'
import { useDatabasePublicationsQuery } from 'data/database-publications/database-publications-query'
import { CONSTRAINT_TYPE, useTableConstraintsQuery } from 'data/database/constraints-query'
import { useForeignKeyConstraintsQuery } from 'data/database/foreign-key-constraints-query'
import { useEnumeratedTypesQuery } from 'data/enumerated-types/enumerated-types-query'
import { useCustomContent } from 'hooks/custom-content/useCustomContent'
import { useChanged } from 'hooks/misc/useChanged'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useQuerySchemaState } from 'hooks/misc/useSchemaQueryState'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useTableCreateGeneratePolicies } from 'hooks/misc/useTableCreateGeneratePolicies'
import { useUrlState } from 'hooks/ui/useUrlState'
import { useProtectedSchemas } from 'hooks/useProtectedSchemas'
import { DOCS_URL } from 'lib/constants'
import { useTrack } from 'lib/telemetry/track'
import { type PlainObject } from 'lib/type-helpers'
import { isEmpty, noop } from 'lodash'
import { useContext, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { TableEditorStateContext, useTableEditorStateSnapshot } from 'state/table-editor'
import { Badge, Checkbox, Input, SidePanel } from 'ui'
import { Admonition } from 'ui-patterns'
import { ConfirmationModal } from 'ui-patterns/Dialogs/ConfirmationModal'

import { ActionBar } from '../ActionBar'
import type { ForeignKey } from '../ForeignKeySelector/ForeignKeySelector.types'
import { formatForeignKeys } from '../ForeignKeySelector/ForeignKeySelector.utils'
import type { SaveTableParams } from '../SidePanelEditor'
import type { ColumnField } from '../SidePanelEditor.types'
import { SpreadsheetImport } from '../SpreadsheetImport/SpreadsheetImport'
import { ApiAccessToggle, type TableApiAccessHandlerWithHistoryReturn } from './ApiAccessToggle'
import ColumnManagement from './ColumnManagement'
import { ForeignKeysManagement } from './ForeignKeysManagement/ForeignKeysManagement'
import { HeaderTitle } from './HeaderTitle'
import { RLSDisableModalContent } from './RLSDisableModal'
import { RLSManagement } from './RLSManagement/RLSManagement'
import { DEFAULT_COLUMNS } from './TableEditor.constants'
import type { ImportContent, TableField } from './TableEditor.types'
import {
  formatImportedContentToColumnFields,
  generateTableField,
  generateTableFieldFromPostgresTable,
  validateFields,
} from './TableEditor.utils'
import { useDataApiGrantTogglesEnabled } from '@/hooks/misc/useDataApiGrantTogglesEnabled'
import { checkDataApiPrivilegesNonEmpty } from '@/lib/data-api-types'

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
  apiAccessToggleHandler: TableApiAccessHandlerWithHistoryReturn
}

export const TableEditor = ({
  table,
  isDuplicating,
  templateData,
  visible = false,
  closePanel = noop,
  saveChanges = noop,
  updateEditorDirty = noop,
  apiAccessToggleHandler,
}: TableEditorProps) => {
  const track = useTrack()
  const snap = useTableEditorStateSnapshot()
  const tableEditorApi = useContext(TableEditorStateContext)
  const { realtimeAll: realtimeEnabled } = useIsFeatureEnabled(['realtime:all'])
  const { docsRowLevelSecurityGuidePath } = useCustomContent(['docs:row_level_security_guide_path'])

  const isApiGrantTogglesEnabled = useDataApiGrantTogglesEnabled()

  const [params, setParams] = useUrlState()
  const { data: project } = useSelectedProjectQuery()
  const { selectedSchema } = useQuerySchemaState()

  const isNewRecord = table === undefined
  const visibleChanged = useChanged(visible)

  const [errors, setErrors] = useState<PlainObject>({})
  const [tableFields, setTableFields] = useState<TableField>()
  const [fkRelations, setFkRelations] = useState<ForeignKey[]>([])

  const [isDuplicateRows, setIsDuplicateRows] = useState<boolean>(false)
  const [importContent, setImportContent] = useState<ImportContent>()
  const [isImportingSpreadsheet, setIsImportingSpreadsheet] = useState<boolean>(false)
  const [rlsConfirmVisible, setRlsConfirmVisible] = useState<boolean>(false)

  const [generatedPolicies, setGeneratedPolicies] = useState<GeneratedPolicy[]>([])

  const { enabled: generatePoliciesEnabled } = useTableCreateGeneratePolicies({
    isNewRecord,
    projectInsertedAt: project?.inserted_at,
  })

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
  const realtimePublication = (publications ?? []).find(
    (publication) => publication.name === 'supabase_realtime'
  )
  const realtimeEnabledTables = realtimePublication?.tables ?? []
  const isRealtimeEnabled = isNewRecord
    ? false
    : realtimeEnabledTables.some((t) => t.id === table?.id)

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
      if (errors.name) toast.error(errors.name)
      if (errors.columns) toast.error(errors.columns)
      setErrors(errors)

      const isNameChanged = tableFields.name.trim() !== table?.name
      const isCommentChanged = tableFields.comment !== table?.comment
      const isRlsEnabledChanged = tableFields.isRLSEnabled !== (table?.rls_enabled ?? false)

      if (isEmpty(errors)) {
        const configuration = {
          tableId: table?.id,
          importContent,
          isRLSEnabled: tableFields.isRLSEnabled,
          isRealtimeEnabled: tableFields.isRealtimeEnabled,
          isDuplicateRows: isDuplicateRows,
          existingForeignKeyRelations: foreignKeys,
          primaryKey,
        }
        const columns = tableFields.columns.map((column) => {
          return { ...column, name: column.name.trim() }
        })

        if (isNewRecord) {
          const payload: SaveTablePayloadFor<'create'> = {
            name: tableFields.name.trim(),
            schema: selectedSchema,
            comment: tableFields.comment?.trim(),
          }
          saveChanges({
            action: 'create',
            payload,
            configuration,
            columns,
            foreignKeyRelations: fkRelations,
            resolve,
            generatedPolicies,
          })
        } else if (isDuplicating) {
          const payload: SaveTablePayloadFor<'duplicate'> = {
            name: tableFields.name.trim(),
            comment: tableFields.comment?.trim(),
          }
          saveChanges({
            action: 'duplicate',
            payload,
            configuration,
            columns,
            foreignKeyRelations: fkRelations,
            resolve,
            generatedPolicies: [],
          })
        } else {
          const payload: SaveTablePayloadFor<'update'> = {
            ...(isNameChanged && { name: tableFields.name.trim() }),
            ...(isCommentChanged && { comment: tableFields.comment?.trim() ?? '' }),
            ...(isRlsEnabledChanged && { rls_enabled: tableFields.isRLSEnabled }),
          }
          saveChanges({
            action: 'update',
            payload,
            configuration,
            columns,
            foreignKeyRelations: fkRelations,
            resolve,
            generatedPolicies: [],
          })
        }
      } else {
        resolve()
      }
    }
  }

  useEffect(() => {
    if (params.create === 'table' && snap.ui.open === 'none') {
      tableEditorApi.onAddTable()
      setParams({ ...params, create: undefined })
    }
  }, [tableEditorApi, setParams, snap.ui.open, params])

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

  const isApiAccessAndPoliciesSectionShown = isApiGrantTogglesEnabled || generatePoliciesEnabled
  const isExposed = isApiGrantTogglesEnabled
    ? !!apiAccessToggleHandler.data?.schemaExposed &&
      checkDataApiPrivilegesNonEmpty(apiAccessToggleHandler.data.privileges)
    : undefined

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
          visible={visible}
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

      {!generatePoliciesEnabled && (
        <>
          <SidePanel.Content className="space-y-10 py-6">
            <Checkbox
              id="enable-rls"
              // @ts-ignore
              label={
                <div className="flex items-center space-x-2">
                  <span>Enable Row Level Security (RLS)</span>
                  <Badge>Recommended</Badge>
                </div>
              }
              description="Restrict access to your table by enabling RLS and writing Postgres policies."
              checked={tableFields.isRLSEnabled}
              onChange={() => {
                // if isEnabled, show confirm modal to turn off
                // if not enabled, allow turning on without modal confirmation
                tableFields.isRLSEnabled
                  ? setRlsConfirmVisible(true)
                  : onUpdateField({ isRLSEnabled: !tableFields.isRLSEnabled })
              }}
              size="medium"
            />

            {tableFields.isRLSEnabled ? (
              <Admonition
                type="default"
                className="!mt-3"
                title="Policies are required to query data"
                description={
                  <>
                    You need to create an access policy before you can query data from this table.
                    Without a policy, querying this table will return an{' '}
                    <u className="text-foreground">empty array</u> of results.{' '}
                    {isNewRecord ? 'You can create policies after saving this table.' : ''}
                  </>
                }
              >
                <DocsButton
                  abbrev={false}
                  className="mt-2"
                  href={`${DOCS_URL}${docsRowLevelSecurityGuidePath}`}
                />
              </Admonition>
            ) : (
              <Admonition
                type="warning"
                className="!mt-3"
                title="You are allowing anonymous access to your table"
                description={
                  <>
                    {tableFields.name ? `The table ${tableFields.name}` : 'Your table'} will be
                    publicly writable and readable
                  </>
                }
              >
                <DocsButton
                  abbrev={false}
                  className="mt-2"
                  href={`${DOCS_URL}${docsRowLevelSecurityGuidePath}`}
                />
              </Admonition>
            )}

            {realtimeEnabled && (
              <Checkbox
                id="enable-realtime"
                label="Enable Realtime"
                description="Broadcast changes on this table to authorized subscribers"
                checked={tableFields.isRealtimeEnabled}
                onChange={() => {
                  track('realtime_toggle_table_clicked', {
                    newState: tableFields.isRealtimeEnabled ? 'disabled' : 'enabled',
                    origin: 'tableSidePanel',
                  })
                  onUpdateField({
                    isRealtimeEnabled: !tableFields.isRealtimeEnabled,
                  })
                }}
                size="medium"
              />
            )}
          </SidePanel.Content>

          <SidePanel.Separator />
        </>
      )}

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

        {!generatePoliciesEnabled && (
          <ConfirmationModal
            visible={rlsConfirmVisible}
            title="Turn off Row Level Security"
            confirmLabel="Confirm"
            size="medium"
            onCancel={() => setRlsConfirmVisible(false)}
            onConfirm={() => {
              onUpdateField({ isRLSEnabled: !tableFields.isRLSEnabled })
              setRlsConfirmVisible(false)
            }}
          >
            <RLSDisableModalContent />
          </ConfirmationModal>
        )}
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

      {isApiAccessAndPoliciesSectionShown && (
        <>
          <SidePanel.Separator />
          <SidePanel.Content className="py-6 space-y-6">
            {isApiGrantTogglesEnabled && (
              <ApiAccessToggle
                projectRef={project?.ref}
                schemaName={isNewRecord ? selectedSchema : table?.schema}
                tableName={
                  isNewRecord || isDuplicating ? tableFields.name : tableFields.name || table?.name
                }
                handler={apiAccessToggleHandler}
              />
            )}

            {/* [Joshen] Temporarily hide this section if duplicating, as we aren't duplicating policies atm when duplicating tables */}
            {/* We should do this thought, but let's do this in another PR as the current one is already quite big */}
            {generatePoliciesEnabled && !isDuplicating && (
              <RLSManagement
                table={table}
                tableFields={tableFields}
                foreignKeyRelations={isNewRecord ? fkRelations : undefined}
                isNewRecord={isNewRecord}
                isDuplicating={isDuplicating}
                isExposed={isExposed}
                generatedPolicies={generatedPolicies}
                onGeneratedPoliciesChange={setGeneratedPolicies}
                onRLSUpdate={(value) => onUpdateField({ isRLSEnabled: value })}
              />
            )}
          </SidePanel.Content>
        </>
      )}
    </SidePanel>
  )
}
