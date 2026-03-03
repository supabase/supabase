import AlertError from 'components/ui/AlertError'
import { DocsButton } from 'components/ui/DocsButton'
import SchemaSelector from 'components/ui/SchemaSelector'
import { useEnumeratedTypesQuery } from 'data/enumerated-types/enumerated-types-query'
import { useQuerySchemaState } from 'hooks/misc/useSchemaQueryState'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useIsProtectedSchema } from 'hooks/useProtectedSchemas'
import { Edit, MoreVertical, Search, Trash } from 'lucide-react'
import { parseAsBoolean, parseAsString, useQueryState } from 'nuqs'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  Button,
  Card,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { ProtectedSchemaWarning } from '../ProtectedSchemaWarning'
import CreateEnumeratedTypeSidePanel from './CreateEnumeratedTypeSidePanel'
import EditEnumeratedTypeSidePanel from './EditEnumeratedTypeSidePanel'
import { useEnumeratedTypeDeleteMutation } from '@/data/enumerated-types/enumerated-type-delete-mutation'

export const EnumeratedTypes = () => {
  const { data: project } = useSelectedProjectQuery()
  const [search, setSearch] = useState('')
  const { selectedSchema, setSelectedSchema } = useQuerySchemaState()

  const {
    data = [],
    error,
    isPending: isLoading,
    isError,
    isSuccess,
  } = useEnumeratedTypesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const {
    mutate: deleteEnumeratedType,
    isPending: isDeleting,
    isSuccess: isSuccessDelete,
  } = useEnumeratedTypeDeleteMutation({
    onSuccess: (_, vars) => {
      toast.success(`Successfully deleted type "${vars.name}"`)
      setSelectedTypeIdToDelete(null)
    },
  })

  const [showCreateTypePanel, setShowCreateTypePanel] = useQueryState(
    'new',
    parseAsBoolean.withDefault(false)
  )

  const [selectedTypeIdToEdit, setSelectedTypeIdToEdit] = useQueryState('edit', parseAsString)
  const typeToEdit = data?.find((type) => type.id.toString() === selectedTypeIdToEdit)

  const [selectedTypeIdToDelete, setSelectedTypeIdToDelete] = useQueryState('delete', parseAsString)
  const typeToDelete = data?.find((type) => type.id.toString() === selectedTypeIdToDelete)

  const enumeratedTypes = (data ?? []).filter((type) => type.enums.length > 0)
  const filteredEnumeratedTypes =
    search.length > 0
      ? enumeratedTypes.filter(
          (x) => x.schema === selectedSchema && x.name.toLowerCase().includes(search.toLowerCase())
        )
      : enumeratedTypes.filter((x) => x.schema === selectedSchema)

  const { isSchemaLocked } = useIsProtectedSchema({ schema: selectedSchema })

  const onConfirmDeleteType = () => {
    if (typeToDelete === undefined) return console.error('No enumerated type selected')
    if (project?.ref === undefined) return console.error('Project ref required')
    if (project?.connectionString === undefined)
      return console.error('Project connectionString required')

    deleteEnumeratedType({
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      name: typeToDelete.name,
      schema: typeToDelete.schema,
    })
  }

  useEffect(() => {
    if (isSuccess && !!selectedTypeIdToEdit && !typeToEdit) {
      toast('Type cannot be found')
      setSelectedTypeIdToEdit(null)
    }
  }, [isSuccess, selectedTypeIdToEdit, setSelectedTypeIdToEdit, typeToEdit])

  useEffect(() => {
    if (isSuccess && !!selectedTypeIdToDelete && !typeToDelete && !isSuccessDelete) {
      toast('Type cannot be found')
      setSelectedTypeIdToDelete(null)
    }
  }, [isSuccess, selectedTypeIdToDelete, setSelectedTypeIdToDelete, typeToDelete, isSuccessDelete])

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 flex-wrap">
        <div className="flex flex-col lg:flex-row lg:items-center gap-2 flex-wrap">
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
            icon={<Search />}
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
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead key="schema">Schema</TableHead>
                <TableHead key="name">Name</TableHead>
                <TableHead key="values">Values</TableHead>
                <TableHead key="actions" />
              </TableRow>
            </TableHeader>
            <TableBody>
              <>
                {filteredEnumeratedTypes.length === 0 && search.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4}>
                      <p className="text-sm text-foreground">No enumerated types created yet</p>
                      <p className="text-sm text-foreground-light">
                        There are no enumerated types found in the schema "{selectedSchema}"
                      </p>
                    </TableCell>
                  </TableRow>
                )}
                {filteredEnumeratedTypes.length === 0 && search.length > 0 && (
                  <TableRow>
                    <TableCell colSpan={4}>
                      <p className="text-sm text-foreground">No results found</p>
                      <p className="text-sm text-foreground-light">
                        Your search for "{search}" did not return any results
                      </p>
                    </TableCell>
                  </TableRow>
                )}
                {filteredEnumeratedTypes.length > 0 &&
                  filteredEnumeratedTypes.map((type) => (
                    <TableRow key={type.id}>
                      <TableCell className="w-20">
                        <p className="w-20 truncate">{type.schema}</p>
                      </TableCell>
                      <TableCell>{type.name}</TableCell>
                      <TableCell>{type.enums.join(', ')}</TableCell>
                      <TableCell>
                        {!isSchemaLocked && (
                          <div className="flex justify-end items-center space-x-2">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button type="default" className="px-1" icon={<MoreVertical />} />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent side="bottom" align="end" className="w-32">
                                <DropdownMenuItem
                                  className="space-x-2"
                                  onClick={() => setSelectedTypeIdToEdit(type.id.toString())}
                                >
                                  <Edit size={14} />
                                  <p>Update type</p>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="space-x-2"
                                  onClick={() => setSelectedTypeIdToDelete(type.id.toString())}
                                >
                                  <Trash size={14} />
                                  <p>Delete type</p>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
              </>
            </TableBody>
          </Table>
        </Card>
      )}

      <CreateEnumeratedTypeSidePanel
        visible={showCreateTypePanel}
        onClose={() => setShowCreateTypePanel(false)}
        schema={selectedSchema}
      />

      <EditEnumeratedTypeSidePanel
        visible={!!typeToEdit}
        selectedEnumeratedType={typeToEdit}
        onClose={() => setSelectedTypeIdToEdit(null)}
      />

      <ConfirmationModal
        variant="destructive"
        size="medium"
        loading={isDeleting}
        visible={!!typeToDelete}
        title={
          <>
            Confirm to delete enumerated type <code className="text-sm">{typeToDelete?.name}</code>
          </>
        }
        confirmLabel="Confirm delete"
        confirmLabelLoading="Deleting..."
        onCancel={() => setSelectedTypeIdToDelete(null)}
        onConfirm={() => onConfirmDeleteType()}
        alert={{
          title: 'This action cannot be undone',
          description:
            'You will need to re-create the enumerated type if you want to revert the deletion.',
        }}
      >
        <p className="text-sm">Before deleting this enumerated type, consider:</p>
        <ul className="space-y-2 mt-2 text-sm text-foreground-light">
          <li className="list-disc ml-6">
            This enumerated type is no longer in use in any tables or functions
          </li>
        </ul>
      </ConfirmationModal>
    </div>
  )
}
