import type { PostgresTable, PostgresType } from '@supabase/postgres-meta'
import { isEmpty, isUndefined, noop } from 'lodash'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import ConfirmationModal from 'components/ui/ConfirmationModal'
import { useForeignKeyConstraintsQuery } from 'data/database/foreign-key-constraints-query'
import { useIsFeatureEnabled, useStore } from 'hooks'
import { EXCLUDED_SCHEMAS } from 'lib/constants/schemas'
import { useTableEditorStateSnapshot } from 'state/table-editor'
import { Alert, Badge, Button, Checkbox, IconBookOpen, Input, Modal, SidePanel } from 'ui'
import { SpreadsheetImport } from '../'
import ActionBar from '../ActionBar'
import { ColumnField, CreateTablePayload, UpdateTablePayload } from '../SidePanelEditor.types'
import ColumnManagement from './ColumnManagement'
import HeaderTitle from './HeaderTitle'
import RLSDisableModalContent from './RLSDisableModal'
import { DEFAULT_COLUMNS } from './TableEditor.constants'
import { ImportContent, TableField } from './TableEditor.types'
import {
  formatImportedContentToColumnFields,
  generateTableField,
  generateTableFieldFromPostgresTable,
  validateFields,
} from './TableEditor.utils'

export interface TableEditorProps {
  table?: PostgresTable
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
      isRealtimeEnabled: boolean
      isDuplicateRows: boolean
    },
    resolve: any
  ) => void
  updateEditorDirty: () => void
}

const TableEditor = ({
  table,
  isDuplicating,
  visible = false,
  closePanel = noop,
  saveChanges = noop,
  updateEditorDirty = noop,
}: TableEditorProps) => {
  const snap = useTableEditorStateSnapshot()
  const { ui, meta } = useStore()
  const { project } = useProjectContext()
  const isNewRecord = isUndefined(table)

  const realtimeEnabled = useIsFeatureEnabled('realtime:all')

  const enumTypes = meta.types.list((type: PostgresType) => !EXCLUDED_SCHEMAS.includes(type.schema))

  const publications = meta.publications.list()
  const realtimePublication = publications.find(
    (publication) => publication.name === 'supabase_realtime'
  )
  const realtimeEnabledTables = realtimePublication?.tables ?? []
  const isRealtimeEnabled = isNewRecord
    ? false
    : realtimeEnabledTables.some((t: any) => t.id === table?.id)

  const [errors, setErrors] = useState<any>({})
  const [tableFields, setTableFields] = useState<TableField>()
  const [isDuplicateRows, setIsDuplicateRows] = useState<boolean>(false)
  const [importContent, setImportContent] = useState<ImportContent>()
  const [isImportingSpreadsheet, setIsImportingSpreadsheet] = useState<boolean>(false)
  const [rlsConfirmVisible, setRlsConfirmVisible] = useState<boolean>(false)

  const { data } = useForeignKeyConstraintsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    schema: table?.schema,
  })
  const foreignKeyMeta = data || []

  useEffect(() => {
    if (visible) {
      setErrors({})
      setImportContent(undefined)
      setIsDuplicateRows(false)
      if (isNewRecord) {
        const tableFields = generateTableField()
        setTableFields(tableFields)
      } else {
        const tableFields = generateTableFieldFromPostgresTable(
          table!,
          foreignKeyMeta,
          isDuplicating,
          isRealtimeEnabled
        )
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
        ui.setNotification({ category: 'error', message: errors.columns, duration: 4000 })
      }
      setErrors(errors)

      if (isEmpty(errors)) {
        const payload: CreateTablePayload | UpdateTablePayload = {
          name: tableFields.name,
          schema: snap.selectedSchemaName,
          comment: tableFields.comment,
          ...(!isNewRecord && { rls_enabled: tableFields.isRLSEnabled }),
        }
        const columns = tableFields.columns.map((column) => {
          if (column.foreignKey) {
            return {
              ...column,
              foreignKey: { ...column.foreignKey, source_table_name: tableFields.name },
            }
          }
          return column
        })
        const configuration = {
          tableId: table?.id,
          importContent,
          isRLSEnabled: tableFields.isRLSEnabled,
          isRealtimeEnabled: tableFields.isRealtimeEnabled,
          isDuplicateRows: isDuplicateRows,
        }

        saveChanges(payload, columns, isNewRecord, configuration, resolve)
      } else {
        resolve()
      }
    }
  }

  if (!tableFields) return null

  return (
    <SidePanel
      size="large"
      key="TableEditor"
      visible={visible}
      header={
        <HeaderTitle schema={snap.selectedSchemaName} table={table} isDuplicating={isDuplicating} />
      }
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
      <>
        <SidePanel.Content>
          <div className="space-y-10 py-6">
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
          </div>
        </SidePanel.Content>
        <SidePanel.Separator />
        <SidePanel.Content>
          <div className="space-y-10 py-6">
            <Checkbox
              id="enable-rls"
              // @ts-ignore
              label={
                <div className="flex items-center space-x-2">
                  <span>Enable Row Level Security (RLS)</span>
                  <Badge color="gray">Recommended</Badge>
                </div>
              }
              // @ts-ignore
              description={
                <>
                  <p>
                    Restrict access to your table by enabling RLS and writing Postgres policies.
                  </p>
                </>
              }
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
              <Alert
                withIcon
                variant="info"
                className="!px-4 !py-3 mt-3"
                title="Policies are required to query data"
              >
                <p>
                  You need to write an access policy before you can query data from this table.
                  Without a policy, querying this table will result in an <u>empty array</u> of
                  results.
                </p>
                {isNewRecord && (
                  <p className="mt-3">You can create policies after you create this table.</p>
                )}
                <p className="mt-4">
                  <Button asChild type="default" icon={<IconBookOpen strokeWidth={1.5} />}>
                    <Link
                      href="https://supabase.com/docs/guides/auth/row-level-security"
                      target="_blank"
                      rel="noreferrer"
                    >
                      RLS Documentation
                    </Link>
                  </Button>
                </p>
              </Alert>
            ) : (
              <Alert
                withIcon
                variant="warning"
                className="!px-4 !py-3 mt-3"
                title="You are allowing anonymous access to your table"
              >
                <p>
                  {tableFields.name ? `The table ${tableFields.name}` : 'Your table'} will be
                  publicly writable and readable
                </p>
                <p className="mt-4">
                  <Button asChild type="default" icon={<IconBookOpen strokeWidth={1.5} />}>
                    <Link
                      href="https://supabase.com/docs/guides/auth/row-level-security"
                      target="_blank"
                      rel="noreferrer"
                    >
                      RLS Documentation
                    </Link>
                  </Button>
                </p>
              </Alert>
            )}
            {realtimeEnabled && (
              <Checkbox
                id="enable-realtime"
                label="Enable Realtime"
                description="Broadcast changes on this table to authorized subscribers"
                checked={tableFields.isRealtimeEnabled}
                onChange={() =>
                  onUpdateField({ isRealtimeEnabled: !tableFields.isRealtimeEnabled })
                }
                size="medium"
              />
            )}
          </div>
        </SidePanel.Content>
        <SidePanel.Separator />
        <SidePanel.Content>
          <div className="space-y-10 py-6">
            {!isDuplicating && (
              <ColumnManagement
                table={{ name: tableFields.name, schema: snap.selectedSchemaName }}
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

            <ConfirmationModal
              visible={rlsConfirmVisible}
              header="Turn off Row Level Security"
              buttonLabel="Confirm"
              size="medium"
              onSelectCancel={() => setRlsConfirmVisible(false)}
              onSelectConfirm={() => {
                onUpdateField({ isRLSEnabled: !tableFields.isRLSEnabled })
                setRlsConfirmVisible(false)
              }}
            >
              <Modal.Content>
                <RLSDisableModalContent />
              </Modal.Content>
            </ConfirmationModal>
          </div>
        </SidePanel.Content>
      </>
    </SidePanel>
  )
}

export default TableEditor
