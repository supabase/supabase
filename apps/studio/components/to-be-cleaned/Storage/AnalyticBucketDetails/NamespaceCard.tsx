import { ChevronRight, RefreshCw, SquareArrowOutUpRight, Table, Table2, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'

import { IntegrationDefinition } from 'components/interfaces/Integrations/Landing/Integrations.constants'
import { WrapperMeta } from 'components/interfaces/Integrations/Wrappers/Wrappers.types'
import { FormattedWrapperTable } from 'components/interfaces/Integrations/Wrappers/Wrappers.utils'
import { ImportForeignSchemaDialog } from 'components/interfaces/Storage/ImportForeignSchemaDialog'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useFDWImportForeignSchemaMutation } from 'data/fdw/fdw-import-foreign-schema-mutation'
import { useFDWUpdateMutation } from 'data/fdw/fdw-update-mutation'
import { FDW, useFDWsQuery } from 'data/fdw/fdws-query'
import { useIcebergNamespaceTablesQuery } from 'data/storage/iceberg-namespace-tables-query'
import { getDecryptedValue } from 'data/vault/vault-secret-decrypted-value-query'
import { BASE_PATH } from 'lib/constants'
import { Badge, Button, Card } from 'ui'

export const NamespaceCard = ({
  bucketName,
  namespace,
  tables,
  integration,
  token,
  wrapperInstance,
  wrapperValues,
}: {
  bucketName: string
  namespace: string
  tables: (FormattedWrapperTable & { id: number })[]
  integration: IntegrationDefinition
  token: string
  wrapperInstance: FDW
  wrapperValues: Record<string, string>
}) => {
  const { project } = useProjectContext()
  const [loadingUnlinkTable, setLoadingUnlinkTable] = useState<number | undefined>(undefined)
  const [importForeignSchemaShown, setImportForeignSchemaShown] = useState(false)

  const targetSchema = tables[0]?.schema_name ?? ''

  const { data: tablesData, isLoading: isLoadingNamespaceTables } = useIcebergNamespaceTablesQuery(
    {
      catalogUri: wrapperValues.catalog_uri,
      warehouse: wrapperValues.warehouse,
      token: token,
      namespace: namespace,
    },
    { enabled: !!token }
  )

  const wrapperMeta = (integration?.type === 'wrapper' && integration.meta) as WrapperMeta
  const { mutateAsync: updateFDW } = useFDWUpdateMutation()

  const { mutateAsync: importForeignSchema, isLoading: isImportingForeignSchema } =
    useFDWImportForeignSchemaMutation()

  const { isLoading: isLoadingFDWs } = useFDWsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const onUnlinkTable = async (tableId: number) => {
    setLoadingUnlinkTable(tableId)
    try {
      const wrapperTables = tables.filter((t) => !(t.id === tableId))

      const valuesArray = await Promise.all(
        wrapperMeta.server.options.map(async (option) => {
          if (wrapperValues[option.name] === undefined) {
            return { name: option.name, value: '' }
          }
          if (option.secureEntry) {
            const decryptedValue = await getDecryptedValue({
              projectRef: project?.ref,
              connectionString: project?.connectionString,
              id: wrapperValues[option.name],
            })
            return { name: option.name, value: decryptedValue[0].decrypted_secret }
          }
          return { name: option.name, value: wrapperValues[option.name] }
        })
      )
      const valuesObj = valuesArray
        .filter((v) => v.value !== '')
        .reduce(
          (obj, option) => {
            obj[option.name] = option.value
            return obj
          },
          {} as Record<string, string>
        )

      updateFDW({
        projectRef: project?.ref,
        connectionString: project?.connectionString,
        wrapper: wrapperInstance,
        wrapperMeta: wrapperMeta,
        formState: {
          wrapper_name: wrapperInstance?.name,
          server_name: wrapperInstance?.server_name,
          ...valuesObj,
        },
        tables: wrapperTables,
      })
    } catch (error) {
      console.error(error)
    }
    setLoadingUnlinkTable(undefined)
  }

  const rescanNamespace = async () => {
    await importForeignSchema({
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      serverName: wrapperInstance.server_name,
      sourceSchema: namespace,
      targetSchema: targetSchema,
    })
  }

  const missingTables = useMemo(() => {
    return (tablesData || []).filter(
      (t) => !tables.find((table) => table.table.split('.')[1] === t)
    )
  }, [tablesData, tables])

  let scanTooltip = useMemo(() => {
    if (isImportingForeignSchema) return 'Scanning for new tables...'
    if (isLoadingNamespaceTables) return 'Loading tables...'
    if (missingTables.length > 0) return `Found ${missingTables.length} new tables`
    if (tables.length === 0) return 'No tables found'
    return 'All tables are up to date'
  }, [isImportingForeignSchema, isLoadingNamespaceTables, missingTables.length, tables.length])

  return (
    <Card key={namespace} className="w-full flex flex-col">
      <div className="flex flex-row gap-4 justify-between items-center p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-x-1 text-sm">
            <Table className="h-4 w-4 text-foreground-light" />
            <span className="text-foreground-light">Namespace:</span>
            <span className="text-foreground">{namespace}</span>
            {targetSchema && (
              <>
                <span className="text-foreground-light">mapped to</span>
                <span className="text-foreground">{targetSchema}</span>
                <span className="text-foreground-light">schema</span>
              </>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <ButtonTooltip
            type="default"
            icon={<RefreshCw className="h-3 w-3" />}
            loading={isImportingForeignSchema || isLoadingNamespaceTables}
            onClick={() => (targetSchema ? rescanNamespace() : setImportForeignSchemaShown(true))}
            disabled={missingTables.length === 0}
            tooltip={{
              content: { text: scanTooltip },
            }}
          >
            {targetSchema ? 'Add' : 'Connect'}
          </ButtonTooltip>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t bg-dash-sidebar p-4 rounded-b-lg">
        {tables.length === 0 && (
          <div className="flex flex-col gap-2 items-center justify-center">
            <p className="text-foreground-light text-sm">No connected tables</p>
          </div>
        )}
        {tables?.map((table) => {
          const target = table.table ?? table.object

          return (
            <div className="flex flex-row gap-2 justify-between items-center" key={table.id}>
              <div key={table.id} className="flex items-center -space-x-3">
                <Badge className="bg-surface-300 bg-opacity-100 pr-1 gap-2 font-mono text-[0.75rem] h-6 text-foreground">
                  <div className="relative w-3 h-3 flex items-center justify-center">
                    {integration.icon({ className: 'p-0' })}
                  </div>
                  {target}{' '}
                  <ChevronRight
                    size={12}
                    strokeWidth={1.5}
                    className="text-foreground-lighter/50"
                  />
                </Badge>

                <Link href={`/project/${project?.ref}/editor/${table.id}`}>
                  <Badge className="transition hover:bg-surface-300 pl-5 rounded-l-none gap-2 h-6 font-mono text-[0.75rem] border-l-0">
                    <Table2 size={12} strokeWidth={1.5} className="text-foreground-lighter/50" />
                    {table.schema}.{table.table_name}
                  </Badge>
                </Link>
              </div>
              <div className="flex flex-row gap-2">
                <a
                  href={`${BASE_PATH}/project/${project?.ref}/editor?schema=${table.schema}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Button type="default" icon={<SquareArrowOutUpRight />}>
                    Table Editor
                  </Button>
                </a>
                <a
                  href={`${BASE_PATH}/project/${project?.ref}/sql/new?${encodeURIComponent(`select * from ${table.schema}.${table.name}`)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Button type="default" icon={<SquareArrowOutUpRight />}>
                    SQL Editor
                  </Button>
                </a>
                <Button
                  type="default"
                  icon={<Trash2 />}
                  loading={loadingUnlinkTable === table.id && isLoadingFDWs}
                  onClick={() => onUnlinkTable(table.id)}
                />
              </div>
            </div>
          )
        })}
      </div>
      <ImportForeignSchemaDialog
        bucketName={bucketName}
        namespace={namespace}
        wrapperValues={wrapperValues}
        visible={importForeignSchemaShown}
        onClose={() => setImportForeignSchemaShown(false)}
      />
    </Card>
  )
}
