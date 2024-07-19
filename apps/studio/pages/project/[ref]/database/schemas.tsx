import { partition } from 'lodash'
import { useState } from 'react'

import SchemaGraph from 'components/interfaces/Database/Schemas/SchemaGraph'
import DatabaseLayout from 'components/layouts/DatabaseLayout/DatabaseLayout'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import AlertError from 'components/ui/AlertError'
import SchemaSelector from 'components/ui/SchemaSelector'
import { useSchemasQuery } from 'data/database/schemas-query'
import { EXCLUDED_SCHEMAS } from 'lib/constants/schemas'
import type { NextPageWithLayout } from 'types'

const SchemasPage: NextPageWithLayout = () => {
  const { project } = useProjectContext()
  const {
    data: schemas,
    isSuccess,
    isLoading,
    isError,
    error,
  } = useSchemasQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const [selectedSchema, setSelectedSchema] = useState<string>('public')
  const [protectedSchemas, openSchemas] = partition(schemas, (schema) =>
    EXCLUDED_SCHEMAS.includes(schema?.name ?? '')
  )
  const schema = schemas?.find((schema) => schema.name === selectedSchema)
  const isLocked = protectedSchemas.some((s) => s.id === schema?.id)

  return (
    <>
      <div className="flex w-full h-full flex-col">
        <div className="p-4 border-b border-muted">
          {isLoading && (
            <div className="h-[34px] w-[260px] bg-foreground-lighter rounded shimmering-loader" />
          )}

          {isError && <AlertError error={error as any} subject="Failed to retrieve schemas" />}

          {isSuccess && (
            <SchemaSelector
              className="w-[260px]"
              size="small"
              showError={false}
              selectedSchemaName={selectedSchema}
              onSelectSchema={setSelectedSchema}
            />
          )}
        </div>

        <SchemaGraph schema={selectedSchema}></SchemaGraph>
      </div>
    </>
  )
}

SchemasPage.getLayout = (page) => <DatabaseLayout title="Database">{page}</DatabaseLayout>

export default SchemasPage
