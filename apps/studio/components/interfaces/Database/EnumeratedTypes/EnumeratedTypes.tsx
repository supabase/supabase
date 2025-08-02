import { Edit, MoreVertical, Search, Trash } from 'lucide-react'
import { useState } from 'react'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import Table from 'components/to-be-cleaned/Table'
import AlertError from 'components/ui/AlertError'
import { DocsButton } from 'components/ui/DocsButton'
import SchemaSelector from 'components/ui/SchemaSelector'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useSchemasQuery } from 'data/database/schemas-query'
import {
  EnumeratedType,
  useEnumeratedTypesQuery,
} from 'data/enumerated-types/enumerated-types-query'
import { useQuerySchemaState } from 'hooks/misc/useSchemaQueryState'
import { useIsProtectedSchema } from 'hooks/useProtectedSchemas'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
} from 'ui'
import { ProtectedSchemaWarning } from '../ProtectedSchemaWarning'
import CreateEnumeratedTypeSidePanel from './CreateEnumeratedTypeSidePanel'
import DeleteEnumeratedTypeModal from './DeleteEnumeratedTypeModal'
import EditEnumeratedTypeSidePanel from './EditEnumeratedTypeSidePanel'

const EnumeratedTypes = () => {
  const { project } = useProjectContext()
  const [search, setSearch] = useState('')
  const { selectedSchema, setSelectedSchema } = useQuerySchemaState()
  const [showCreateTypePanel, setShowCreateTypePanel] = useState(false)
  const [selectedTypeToEdit, setSelectedTypeToEdit] = useState<EnumeratedType>()
  const [selectedTypeToDelete, setSelectedTypeToDelete] = useState<EnumeratedType>()

  const { data: schemas } = useSchemasQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const { data, error, isLoading, isError, isSuccess } = useEnumeratedTypesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const enumeratedTypes = (data ?? []).filter((type) => type.enums.length > 0)
  const filteredEnumeratedTypes =
    search.length > 0
      ? enumeratedTypes.filter(
          (x) => x.schema === selectedSchema && x.name.toLowerCase().includes(search.toLowerCase())
        )
      : enumeratedTypes.filter((x) => x.schema === selectedSchema)

  const { isSchemaLocked } = useIsProtectedSchema({ schema: selectedSchema })

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2">
        <div className="flex flex-col lg:flex-row lg:items-center gap-2">
          <SchemaSelector
            className="w-full lg:w-[180px]"
            size="tiny"
            showError={false}
            selectedSchemaName={selectedSchema}
            onSelectSchema={setSelectedSchema}
          />
          <Input
            size="tiny"
            value={search}
            className="w-full lg:w-52"
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search for a type"
            icon={<Search size={14} />}
          />
        </div>

        <div className="flex items-center gap-2">
          <DocsButton href="https://www.postgresql.org/docs/current/datatype-enum.html" />
          {!isSchemaLocked && (
            <Button
              className="ml-auto flex-1"
              type="primary"
              onClick={() => setShowCreateTypePanel(true)}
            >
              Create type
            </Button>
          )}
        </div>
      </div>

      {isSchemaLocked && (
        <ProtectedSchemaWarning schema={selectedSchema} entity="enumerated types" />
      )}

      {isLoading && <GenericSkeletonLoader />}

      {isError && (
        <AlertError error={error} subject="Failed to retrieve database enumerated types" />
      )}

      {isSuccess && (
        <Table
          head={[
            <Table.th key="schema">Schema</Table.th>,
            <Table.th key="name">Name</Table.th>,
            <Table.th key="values">Values</Table.th>,
            <Table.th key="actions" />,
          ]}
          body={
            <>
              {filteredEnumeratedTypes.length === 0 && search.length === 0 && (
                <Table.tr>
                  <Table.td colSpan={4}>
                    <p className="text-sm text-foreground">No enumerated types created yet</p>
                    <p className="text-sm text-foreground-light">
                      There are no enumerated types found in the schema "{selectedSchema}"
                    </p>
                  </Table.td>
                </Table.tr>
              )}
              {filteredEnumeratedTypes.length === 0 && search.length > 0 && (
                <Table.tr>
                  <Table.td colSpan={4}>
                    <p className="text-sm text-foreground">No results found</p>
                    <p className="text-sm text-foreground-light">
                      Your search for "{search}" did not return any results
                    </p>
                  </Table.td>
                </Table.tr>
              )}
              {filteredEnumeratedTypes.length > 0 &&
                filteredEnumeratedTypes.map((type) => (
                  <Table.tr key={type.id}>
                    <Table.td className="w-20">
                      <p className="w-20 truncate">{type.schema}</p>
                    </Table.td>
                    <Table.td>{type.name}</Table.td>
                    <Table.td>{type.enums.join(', ')}</Table.td>
                    <Table.td>
                      {!isSchemaLocked && (
                        <div className="flex justify-end items-center space-x-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button type="default" className="px-1" icon={<MoreVertical />} />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent side="bottom" align="end" className="w-32">
                              <DropdownMenuItem
                                className="space-x-2"
                                onClick={() => setSelectedTypeToEdit(type)}
                              >
                                <Edit size={14} />
                                <p>Update type</p>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="space-x-2"
                                onClick={() => setSelectedTypeToDelete(type)}
                              >
                                <Trash size={14} />
                                <p>Delete type</p>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )}
                    </Table.td>
                  </Table.tr>
                ))}
            </>
          }
        />
      )}

      <CreateEnumeratedTypeSidePanel
        visible={showCreateTypePanel}
        onClose={() => setShowCreateTypePanel(false)}
        schema={selectedSchema}
      />

      <EditEnumeratedTypeSidePanel
        visible={selectedTypeToEdit !== undefined}
        selectedEnumeratedType={selectedTypeToEdit}
        onClose={() => setSelectedTypeToEdit(undefined)}
      />

      <DeleteEnumeratedTypeModal
        visible={selectedTypeToDelete !== undefined}
        selectedEnumeratedType={selectedTypeToDelete}
        onClose={() => setSelectedTypeToDelete(undefined)}
      />
    </div>
  )
}

export default EnumeratedTypes
