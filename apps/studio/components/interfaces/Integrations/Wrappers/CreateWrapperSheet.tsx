import { useQueryClient } from '@tanstack/react-query'
import { isEmpty } from 'lodash'
import { Edit, Trash } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { FormSection, FormSectionContent, FormSectionLabel } from 'components/ui/Forms/FormSection'
import { invalidateSchemasQuery } from 'data/database/schemas-query'
import { useFDWCreateMutation } from 'data/fdw/fdw-create-mutation'
import { Button, Form, Input, SheetFooter, SheetHeader, SheetTitle } from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import InputField from './InputField'
import { WrapperMeta } from './Wrappers.types'
import { makeValidateRequired } from './Wrappers.utils'
import WrapperTableEditor from './WrapperTableEditor'

export interface CreateWrapperSheetProps {
  isClosing: boolean
  wrapperMeta: WrapperMeta
  setIsClosing: (v: boolean) => void
  onClose: () => void
}

const FORM_ID = 'create-wrapper-form'

export const CreateWrapperSheet = ({
  wrapperMeta,
  isClosing,
  setIsClosing,
  onClose,
}: CreateWrapperSheetProps) => {
  const queryClient = useQueryClient()
  const { project } = useProjectContext()

  const [newTables, setNewTables] = useState<any[]>([])
  const [isEditingTable, setIsEditingTable] = useState(false)
  const [selectedTableToEdit, setSelectedTableToEdit] = useState()
  const [formErrors, setFormErrors] = useState<{ [k: string]: string }>({})

  const { mutate: createFDW, isLoading: isCreating } = useFDWCreateMutation({
    onSuccess: () => {
      toast.success(`Successfully created ${wrapperMeta?.label} foreign data wrapper`)
      setNewTables([])

      const hasNewSchema = newTables.some((table) => table.is_new_schema)
      if (hasNewSchema) invalidateSchemasQuery(queryClient, project?.ref)

      onClose()
    },
  })

  const initialValues = {
    wrapper_name: '',
    server_name: '',
    ...Object.fromEntries(
      wrapperMeta.server.options.map((option) => [option.name, option.defaultValue ?? ''])
    ),
  }

  const onUpdateTable = (values: any) => {
    setNewTables((prev) => {
      // if the new values have tableIndex, we are editing an existing table
      if (values.tableIndex !== undefined) {
        const tableIndex = values.tableIndex
        const newTables = [...prev]
        delete values.tableIndex
        newTables[tableIndex] = values
        return newTables
      }
      return [...prev, values]
    })
    setIsEditingTable(false)
    setSelectedTableToEdit(undefined)
  }

  const onSubmit = async (values: any) => {
    const validate = makeValidateRequired(wrapperMeta.server.options)
    const errors: any = validate(values)

    const { wrapper_name } = values
    if (wrapper_name.length === 0) errors.name = 'Please provide a name for your wrapper'
    if (newTables.length === 0) errors.tables = 'Please add at least one table'
    if (!isEmpty(errors)) return setFormErrors(errors)

    createFDW({
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      wrapperMeta,
      formState: { ...values, server_name: `${wrapper_name}_server` },
      tables: newTables,
    })
  }

  return (
    <>
      <div className="h-full" tabIndex={-1}>
        <Form
          id={FORM_ID}
          initialValues={initialValues}
          onSubmit={onSubmit}
          className="flex-grow flex flex-col h-full"
        >
          {({ handleReset, values, initialValues }: any) => {
            const hasChanges = JSON.stringify(values) !== JSON.stringify(initialValues)

            const onClosePanel = () => {
              if (hasChanges) {
                setIsClosing(true)
              } else {
                onClose()
              }
            }

            // if the form hasn't been touched and the user clicked esc or the backdrop, close the sheet
            if (!hasChanges && isClosing) {
              onClose()
            }

            return (
              <>
                <SheetHeader>
                  <SheetTitle>Create a {wrapperMeta.label} wrapper</SheetTitle>
                </SheetHeader>
                <div className="flex-grow overflow-y-auto">
                  <FormSection header={<FormSectionLabel>Wrapper Configuration</FormSectionLabel>}>
                    <FormSectionContent loading={false}>
                      <Input
                        id="wrapper_name"
                        label="Wrapper Name"
                        error={formErrors.wrapper_name}
                        descriptionText={
                          (values?.wrapper_name ?? '').length > 0 ? (
                            <>
                              Your wrapper's server name will be{' '}
                              <code className="text-xs">{values.wrapper_name}_server</code>
                            </>
                          ) : (
                            ''
                          )
                        }
                      />
                    </FormSectionContent>
                  </FormSection>
                  <FormSection
                    header={<FormSectionLabel>{wrapperMeta.label} Configuration</FormSectionLabel>}
                  >
                    <FormSectionContent loading={false}>
                      {wrapperMeta.server.options
                        .filter((option) => !option.hidden)
                        .map((option) => (
                          <InputField
                            key={option.name}
                            option={option}
                            loading={false}
                            error={formErrors[option.name]}
                          />
                        ))}
                    </FormSectionContent>
                  </FormSection>
                  <FormSection
                    header={
                      <FormSectionLabel>
                        <p>Foreign Tables</p>
                        <p className="text-foreground-light mt-2 w-[90%]">
                          You can query your data from these foreign tables after the wrapper is
                          created
                        </p>
                      </FormSectionLabel>
                    }
                  >
                    <FormSectionContent loading={false}>
                      {newTables.length === 0 ? (
                        <div className="flex justify-end translate-y-4">
                          <Button type="default" onClick={() => setIsEditingTable(true)}>
                            Add foreign table
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {newTables.map((table, i) => (
                            <div
                              key={`${table.schema_name}.${table.table_name}`}
                              className="flex items-center justify-between px-4 py-2 border rounded-md border-control"
                            >
                              <div>
                                <p className="text-sm">
                                  {table.schema_name}.{table.table_name}
                                </p>
                                <p className="text-sm text-foreground-light">
                                  Columns:{' '}
                                  {table.columns.map((column: any) => column.name).join(', ')}
                                </p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Button
                                  type="default"
                                  className="px-1"
                                  icon={<Edit />}
                                  onClick={() => {
                                    setIsEditingTable(true)
                                    setSelectedTableToEdit({ ...table, tableIndex: i })
                                  }}
                                />
                                <Button
                                  type="default"
                                  className="px-1"
                                  icon={<Trash />}
                                  onClick={() => {
                                    setNewTables((prev) => prev.filter((_, j) => j !== i))
                                  }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {newTables.length > 0 && (
                        <div className="flex justify-end">
                          <Button type="default" onClick={() => setIsEditingTable(true)}>
                            Add foreign table
                          </Button>
                        </div>
                      )}
                      {newTables.length === 0 && formErrors.tables && (
                        <p className="text-sm text-right text-red-900">{formErrors.tables}</p>
                      )}
                    </FormSectionContent>
                  </FormSection>
                </div>

                <SheetFooter>
                  <Button
                    size="tiny"
                    type="default"
                    htmlType="button"
                    onClick={onClosePanel}
                    disabled={isCreating}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="tiny"
                    type="primary"
                    form={FORM_ID}
                    htmlType="submit"
                    disabled={isCreating}
                    loading={isCreating}
                  >
                    Create wrapper
                  </Button>
                </SheetFooter>
              </>
            )
          }}
        </Form>
      </div>
      <ConfirmationModal
        visible={isClosing}
        title="Discard changes"
        confirmLabel="Discard"
        onCancel={() => setIsClosing(false)}
        onConfirm={() => onClose()}
      >
        <p className="text-sm text-foreground-light">
          There are unsaved changes. Are you sure you want to close the panel? Your changes will be
          lost.
        </p>
      </ConfirmationModal>

      <WrapperTableEditor
        visible={isEditingTable}
        tables={wrapperMeta.tables}
        onCancel={() => {
          setSelectedTableToEdit(undefined)
          setIsEditingTable(false)
        }}
        onSave={onUpdateTable}
        initialData={selectedTableToEdit}
      />
    </>
  )
}
