import { FC, useRef, useEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useRouter } from 'next/router'
import { find, isUndefined } from 'lodash'
import type { PostgresColumn, PostgresTable } from '@supabase/postgres-meta'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { SchemaView } from 'types'
import { checkPermissions, useFlag, useStore, useParams } from 'hooks'
import GridHeaderActions from './GridHeaderActions'
import NotFoundState from './NotFoundState'
import SidePanelEditor from './SidePanelEditor'
import { Dictionary, parseSupaTable, SupabaseGrid, SupabaseGridRef } from 'components/grid'
import { IconBookOpen, SidePanel } from 'ui'
import ActionBar from './SidePanelEditor/ActionBar'
import { GeneralContent, ResourceContent } from '../Docs'
import { useProjectApiQuery } from 'data/config/project-api-query'
import { useProjectJsonSchemaQuery } from 'data/docs/project-json-schema-query'
import { snakeToCamel } from 'lib/helpers'
import { JsonEditValue } from './SidePanelEditor/RowEditor/RowEditor.types'
import LangSelector from '../Docs/LangSelector'
import GeneratingTypes from '../Docs/GeneratingTypes'

interface Props {
  /** Theme for the editor */
  theme?: 'dark' | 'light'

  selectedSchema?: string
  selectedTable: any // PostgresTable | SchemaView

  /** Determines what side panel editor to show */
  sidePanelKey?: 'row' | 'column' | 'table' | 'json'
  /** Toggles if we're duplicating a table */
  isDuplicating: boolean
  /** Selected entities if we're editing a row, column or table */
  selectedRowToEdit?: Dictionary<any>
  selectedColumnToEdit?: PostgresColumn
  selectedTableToEdit?: PostgresTable
  selectedValueForJsonEdit?: JsonEditValue

  onAddRow: () => void
  onEditRow: (row: Dictionary<any>) => void
  onAddColumn: () => void
  onEditColumn: (column: PostgresColumn) => void
  onDeleteColumn: (column: PostgresColumn) => void
  onExpandJSONEditor: (column: string, row: any) => void
  onClosePanel: () => void
}

const TableGridEditor: FC<Props> = ({
  theme = 'dark',

  selectedSchema,
  selectedTable,
  sidePanelKey,
  isDuplicating,
  selectedRowToEdit,
  selectedColumnToEdit,
  selectedTableToEdit,
  selectedValueForJsonEdit,

  onAddRow = () => {},
  onEditRow = () => {},
  onAddColumn = () => {},
  onEditColumn = () => {},
  onDeleteColumn = () => {},
  onExpandJSONEditor = () => {},
  onClosePanel = () => {},
}) => {
  const { meta, ui, vault } = useStore()
  const router = useRouter()
  const { ref: projectRef, page, id } = useParams()
  const gridRef = useRef<SupabaseGridRef>(null)

  const tables = meta.tables.list()

  const { data: settings } = useProjectApiQuery({ projectRef: projectRef })

  const autoApiService = {
    ...settings?.autoApiService,
    endpoint: `${settings?.autoApiService.protocol ?? 'https'}://${
      settings?.autoApiService.endpoint ?? '-'
    }`,
  }
  const DEFAULT_KEY = { name: 'hide', key: 'SUPABASE_KEY' }

  const isVaultEnabled = useFlag('vaultExtension')
  const [encryptedColumns, setEncryptedColumns] = useState([])
  const [apiPreviewPanelOpen, setApiPreviewPanelOpen] = useState(false)

  const [selectedLang, setSelectedLang] = useState<any>('js')
  const [showApiKey, setShowApiKey] = useState<any>(DEFAULT_KEY)

  const isReadOnly =
    !checkPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'tables') &&
    !checkPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'columns')

  const getEncryptedColumns = async (table: any) => {
    const columns = await vault.listEncryptedColumns(table.schema, table.name)
    setEncryptedColumns(columns)
  }

  function getResourcesFromJsonSchema(value: any) {
    const { paths } = value || {}
    const functionPath = 'rpc/'
    let resources: any = {}

    Object.entries(paths || []).forEach(([name, val]) => {
      let trimmed = name.slice(1)
      let id = trimmed.replace(functionPath, '')
      let displayName = id.replace(/_/g, ' ')
      let camelCase = snakeToCamel(id)
      let enriched = { id, displayName, camelCase }
      if (!trimmed.length) return
      else resources[id] = enriched
    })

    return resources
  }

  const apiService = settings?.autoApiService
  const anonKey = apiService?.service_api_keys.find((x) => x.name === 'anon key')
    ? apiService.defaultApiKey
    : undefined
  const swaggerUrl = settings?.autoApiService?.restUrl

  const {
    data: jsonSchema,
    error: jsonSchemaError,
    refetch,
  } = useProjectJsonSchemaQuery({
    projectRef,
    swaggerUrl,
    apiKey: anonKey,
  })

  if (jsonSchemaError) console.log('jsonSchemaError', jsonSchemaError)

  const resources = getResourcesFromJsonSchema(jsonSchema)

  const refreshDocs = async () => {
    await refetch()
  }

  useEffect(() => {
    if (selectedTable !== undefined && selectedTable.id !== undefined && isVaultEnabled) {
      getEncryptedColumns(selectedTable)
    }
  }, [selectedTable?.id])

  if (isUndefined(selectedTable)) {
    return <NotFoundState id={Number(id)} />
  }

  const tableId = selectedTable?.id

  // @ts-ignore
  const schema = meta.schemas.list().find((schema) => schema.name === selectedSchema)
  const isViewSelected = !Object.keys(selectedTable).includes('rls_enabled')
  const isForeignTableSelected = meta.foreignTables.byId(selectedTable.id) !== undefined
  const isLocked = meta.excludedSchemas.includes(schema?.name ?? '')
  const canUpdateTables = checkPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'tables')
  const canEditViaTableEditor = !isViewSelected && !isForeignTableSelected && !isLocked

  const gridTable =
    !isViewSelected && !isForeignTableSelected
      ? parseSupaTable(
          {
            table: selectedTable as PostgresTable,
            columns: (selectedTable as PostgresTable).columns ?? [],
            primaryKeys: (selectedTable as PostgresTable).primary_keys,
            relationships: (selectedTable as PostgresTable).relationships,
          },
          encryptedColumns
        )
      : (selectedTable as SchemaView).name

  const gridKey = `${selectedTable.schema}_${selectedTable.name}`

  const onRowCreated = (row: Dictionary<any>) => {
    if (gridRef.current) gridRef.current.rowAdded(row)
  }

  const onRowUpdated = (row: Dictionary<any>, idx: number) => {
    if (gridRef.current) gridRef.current.rowEdited(row, idx)
  }

  const onColumnSaved = (hasEncryptedColumns = false) => {
    if (hasEncryptedColumns) getEncryptedColumns(selectedTable)
  }

  const onTableCreated = (table: PostgresTable) => {
    router.push(`/project/${projectRef}/editor/${table.id}`)
  }

  const onSqlQuery = async (query: string) => {
    const res = await meta.query(query)
    if (res.error) {
      return { error: res.error }
    } else {
      return { data: res }
    }
  }

  const onSelectEditColumn = async (name: string) => {
    // For some reason, selectedTable here is stale after adding a table
    // temporary workaround is to list grab the selected table again
    const tables: PostgresTable[] = meta.tables.list()
    // @ts-ignore
    const table = tables.find((table) => table.id === Number(tableId))
    const column = find(table!.columns, { name }) as PostgresColumn
    if (column) {
      onEditColumn(column)
    } else {
      console.error(`Unable to find column ${name} in ${table?.name}`)
    }
  }

  const onSelectDeleteColumn = async (name: string) => {
    // For some reason, selectedTable here is stale after adding a table
    // temporary workaround is to list grab the selected table again
    const tables: PostgresTable[] = meta.tables.list()
    const table = tables.find((table) => table.id === Number(tableId))
    const column = find(table!.columns, { name }) as PostgresColumn
    onDeleteColumn(column)
  }

  const onError = (error: any) => {
    ui.setNotification({
      category: 'error',
      message: error?.details ?? error?.message ?? error,
    })
  }

  return (
    <>
      <SupabaseGrid
        key={gridKey}
        ref={gridRef}
        theme={theme}
        gridProps={{ height: '100%' }}
        storageRef={projectRef}
        editable={!isReadOnly && canUpdateTables && canEditViaTableEditor}
        schema={selectedTable.schema}
        table={gridTable}
        refreshDocs={refreshDocs}
        headerActions={
          canEditViaTableEditor && (
            <GridHeaderActions
              table={selectedTable as PostgresTable}
              apiPreviewPanelOpen={apiPreviewPanelOpen}
              setApiPreviewPanelOpen={setApiPreviewPanelOpen}
              refreshDocs={refreshDocs}
            />
          )
        }
        onAddColumn={onAddColumn}
        onEditColumn={onSelectEditColumn}
        onDeleteColumn={onSelectDeleteColumn}
        onAddRow={onAddRow}
        onEditRow={onEditRow}
        onError={onError}
        onSqlQuery={onSqlQuery}
        onExpandJSONEditor={onExpandJSONEditor}
      />
      {!isUndefined(selectedSchema) && (
        <SidePanelEditor
          selectedSchema={selectedSchema}
          isDuplicating={isDuplicating}
          selectedTable={selectedTable as PostgresTable}
          selectedRowToEdit={selectedRowToEdit}
          selectedColumnToEdit={selectedColumnToEdit}
          selectedTableToEdit={selectedTableToEdit}
          selectedValueForJsonEdit={selectedValueForJsonEdit}
          sidePanelKey={sidePanelKey}
          onRowCreated={onRowCreated}
          onRowUpdated={onRowUpdated}
          onColumnSaved={onColumnSaved}
          onTableCreated={onTableCreated}
          closePanel={onClosePanel}
        />
      )}

      <SidePanel
        key="WrapperTableEditor"
        size="xxlarge"
        visible={apiPreviewPanelOpen}
        onCancel={() => setApiPreviewPanelOpen(false)}
        header={
          <span className="flex items-center gap-2">
            <IconBookOpen size="tiny" />
            API
          </span>
        }
        customFooter={
          <ActionBar
            backButtonLabel="Close"
            hideApply={true}
            formId="wrapper-table-editor-form"
            closePanel={() => setApiPreviewPanelOpen(false)}
          />
        }
      >
        <div className="Docs Docs--table-editor">
          <SidePanel.Content>
            {jsonSchemaError ? (
              <div className="p-6 mx-auto text-center sm:w-full md:w-3/4">
                <div className="text-scale-1000">
                  <p>Error connecting to API</p>
                  <p>{`${jsonSchemaError}`}</p>
                </div>
              </div>
            ) : (
              <>
                {jsonSchema ? (
                  <>
                    <div className="sticky top-0 z-10 bg-scale-100 dark:bg-scale-300">
                      <LangSelector
                        selectedLang={selectedLang}
                        setSelectedLang={setSelectedLang}
                        showApiKey={showApiKey}
                        setShowApiKey={setShowApiKey}
                        apiKey={anonKey}
                        autoApiService={autoApiService}
                      />
                    </div>
                    <GeneralContent
                      autoApiService={autoApiService}
                      selectedLang={selectedLang}
                      showApiKey={true}
                      page={page}
                    />

                    <GeneratingTypes selectedLang={selectedLang} />

                    {jsonSchema?.definitions && (
                      <ResourceContent
                        autoApiService={autoApiService}
                        selectedLang={selectedLang}
                        resourceId={tables.find((table) => table.id === Number(id))?.name}
                        resources={resources}
                        definitions={jsonSchema.definitions}
                        paths={jsonSchema.paths}
                        showApiKey={showApiKey.key}
                        refreshDocs={refreshDocs}
                      />
                    )}
                  </>
                ) : (
                  <div className="p-6 mx-auto text-center sm:w-full md:w-3/4">
                    <h3 className="text-lg">Building docs ...</h3>
                  </div>
                )}
              </>
            )}
          </SidePanel.Content>
        </div>
      </SidePanel>
    </>
  )
}

export default observer(TableGridEditor)
