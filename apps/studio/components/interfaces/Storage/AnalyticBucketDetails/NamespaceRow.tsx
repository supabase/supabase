import { RefreshCw, SquareArrowOutUpRight } from 'lucide-react'
import { useMemo, useState } from 'react'

import type { WrapperMeta } from 'components/interfaces/Integrations/Wrappers/Wrappers.types'
import { FormattedWrapperTable } from 'components/interfaces/Integrations/Wrappers/Wrappers.utils'
import { ImportForeignSchemaDialog } from 'components/interfaces/Storage/ImportForeignSchemaDialog'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useFDWImportForeignSchemaMutation } from 'data/fdw/fdw-import-foreign-schema-mutation'
import { FDW } from 'data/fdw/fdws-query'
import { useIcebergNamespaceTablesQuery } from 'data/storage/iceberg-namespace-tables-query'
import { BASE_PATH } from 'lib/constants'
import { Button, cn, TableCell, TableRow } from 'ui'

type NamespaceRowProps = {
  bucketName: string
  namespace: string
  schema: string
  tables: (FormattedWrapperTable & { id: number })[]
  token: string
  wrapperInstance: FDW
  wrapperValues: Record<string, string>
  wrapperMeta: WrapperMeta
}

export const NamespaceRow = ({
  bucketName,
  namespace,
  schema,
  tables,
  token,
  wrapperInstance,
  wrapperValues,
  wrapperMeta,
}: NamespaceRowProps) => {
  const { project } = useProjectContext()
  const [importForeignSchemaShown, setImportForeignSchemaShown] = useState(false)

  const { data: tablesData, isLoading: isLoadingNamespaceTables } = useIcebergNamespaceTablesQuery(
    {
      catalogUri: wrapperValues.catalog_uri,
      warehouse: wrapperValues.warehouse,
      token: token,
      namespace: namespace,
    },
    { enabled: !!token }
  )

  const { mutateAsync: importForeignSchema, isLoading: isImportingForeignSchema } =
    useFDWImportForeignSchemaMutation()

  const rescanNamespace = async () => {
    await importForeignSchema({
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      serverName: wrapperInstance.server_name,
      sourceSchema: namespace,
      targetSchema: schema,
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
    <TableRow key={namespace}>
      <TableCell>{namespace}</TableCell>
      <TableCell className={cn(!schema ? 'text-foreground-lighter' : '')}>
        {schema ?? 'No schema'}
      </TableCell>
      <TableCell>
        {tablesData ? `${tables.length}/${tablesData.length} connected tables` : ``}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex gap-2 justify-end">
          <ButtonTooltip
            type={missingTables.length > 0 ? 'primary' : 'default'}
            icon={<RefreshCw className="h-3 w-3" />}
            loading={isImportingForeignSchema || isLoadingNamespaceTables}
            onClick={() => (schema ? rescanNamespace() : setImportForeignSchemaShown(true))}
            disabled={missingTables.length === 0}
            tooltip={{ content: { text: scanTooltip } }}
          >
            Sync
          </ButtonTooltip>
          {schema ? (
            <Button asChild type="default" icon={<SquareArrowOutUpRight />}>
              <a
                target="_blank"
                rel="noreferrer"
                href={`${BASE_PATH}/project/${project?.ref}/editor?schema=${schema}`}
              >
                Open in Table Editor
              </a>
            </Button>
          ) : (
            <ButtonTooltip
              type="default"
              icon={<SquareArrowOutUpRight />}
              disabled
              tooltip={{
                content: { text: 'There are no tables connected.' },
              }}
            >
              Open in Table Editor
            </ButtonTooltip>
          )}
        </div>
      </TableCell>
      <ImportForeignSchemaDialog
        bucketName={bucketName}
        namespace={namespace}
        wrapperMeta={wrapperMeta}
        visible={importForeignSchemaShown}
        onClose={() => setImportForeignSchemaShown(false)}
      />
    </TableRow>
  )
}
