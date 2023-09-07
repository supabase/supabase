import { partition } from 'lodash'
import { useState } from 'react'

import SchemaGraph from 'components/interfaces/Database/Schemas/SchemaGraph'
import { DatabaseLayout } from 'components/layouts'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useSchemasQuery } from 'data/database/schemas-query'
import { EXCLUDED_SCHEMAS } from 'lib/constants/schemas'
import { NextPageWithLayout } from 'types'
import { IconLock, Listbox } from 'ui'

const SchemasPage: NextPageWithLayout = () => {
  const { project } = useProjectContext()
  const { data: schemas } = useSchemasQuery({
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
        <div className="p-4 border-b border-scale-500">
          <Listbox
            className="w-[260px]"
            size="small"
            value={selectedSchema}
            onChange={setSelectedSchema}
            icon={isLocked && <IconLock size={14} strokeWidth={2} />}
          >
            <Listbox.Option disabled key="normal-schemas" value="normal-schemas" label="Schemas">
              <p className="text-sm">Schemas</p>
            </Listbox.Option>
            {openSchemas.map((schema) => (
              <Listbox.Option
                key={schema.id}
                value={schema.name}
                label={schema.name}
                addOnBefore={() => <span className="text-scale-900">schema</span>}
              >
                <span className="text-scale-1200 text-sm">{schema.name}</span>
              </Listbox.Option>
            ))}
            <Listbox.Option
              disabled
              key="protected-schemas"
              value="protected-schemas"
              label="Protected schemas"
            >
              <p className="text-sm">Protected schemas</p>
            </Listbox.Option>
            {protectedSchemas.map((schema) => (
              <Listbox.Option
                key={schema.id}
                value={schema.name}
                label={schema.name}
                addOnBefore={() => <span className="text-scale-900">schema</span>}
              >
                <span className="text-scale-1200 text-sm">{schema.name}</span>
              </Listbox.Option>
            ))}
          </Listbox>
        </div>

        <SchemaGraph schema={selectedSchema}></SchemaGraph>
      </div>
    </>
  )
}

SchemasPage.getLayout = (page) => <DatabaseLayout title="Database">{page}</DatabaseLayout>

export default SchemasPage
