import { useQueryClient } from '@tanstack/react-query'
import { isEmpty } from 'lodash'
import { Edit, Trash } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { FormSection, FormSectionContent, FormSectionLabel } from 'components/ui/Forms/FormSection'
import { invalidateSchemasQuery } from 'data/database/schemas-query'
import { useFDWUpdateMutation } from 'data/fdw/fdw-update-mutation'
import { FDW } from 'data/fdw/fdws-query'
import { getDecryptedValue } from 'data/vault/vault-secret-decrypted-value-query'
import { useVaultSecretsQuery } from 'data/vault/vault-secrets-query'
import { Button, Form, Input, SheetFooter, SheetHeader, SheetTitle } from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import InputField from './InputField'
import { WrapperMeta } from './Wrappers.types'
import {
  convertKVStringArrayToJson,
  formatWrapperTables,
  makeValidateRequired,
} from './Wrappers.utils'
import WrapperTableEditor from './WrapperTableEditor'

export interface EditWrapperSheetProps {
  wrapper: FDW
  isClosing: boolean
  wrapperMeta: WrapperMeta
  setIsClosing: (v: boolean) => void
  onClose: () => void
}

const FORM_ID = 'edit-wrapper-form'

export const EditWrapperSheet = ({
  wrapper,
  wrapperMeta,
  isClosing,
  setIsClosing,
  onClose,
}: EditWrapperSheetProps) => {
  const queryClient = useQueryClient()
  const { project } = useProjectContext()

  const { data: secrets, isLoading: isSecretsLoading } = useVaultSecretsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const { mutate: updateFDW, isLoading: isSaving } = useFDWUpdateMutation({
    onSuccess: () => {
      toast.success(`Successfully updated ${wrapperMeta?.label} foreign data wrapper`)
      setWrapperTables([])

      const hasNewSchema = wrapperTables.some((table) => table.is_new_schema)
      if (hasNewSchema) invalidateSchemasQuery(queryClient, project?.ref)
    },
  })

  const [wrapperTables, setWrapperTables] = useState<any[]>(
    formatWrapperTables(wrapper, wrapperMeta)
  )
  const [isEditingTable, setIsEditingTable] = useState(false)
  const [selectedTableToEdit, setSelectedTableToEdit] = useState()
  const [formErrors, setFormErrors] = useState<{ [k: string]: string }>({})

  const initialValues = {
    wrapper_name: wrapper?.name,
    server_name: wrapper?.server_name,
    ...convertKVStringArrayToJson(wrapper?.server_options ?? []),
  }

  const onUpdateTable = (values: any) => {
    setWrapperTables((prev) => {
      // if the new values have tableIndex, we are editing an existing table
      if (values.tableIndex !== undefined) {
        const tableIndex = values.tableIndex
        const wrapperTables = [...prev]
        delete values.tableIndex
        wrapperTables[tableIndex] = values
        return wrapperTables
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
    if (wrapperTables.length === 0) errors.tables = 'Please add at least one table'
    if (!isEmpty(errors)) return setFormErrors(errors)

    updateFDW({
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      wrapper,
      wrapperMeta,
      formState: { ...values, server_name: `${wrapper_name}_server` },
      tables: wrapperTables,
    })
  }

  return (
    <>
      <div className="flex flex-col h-full" tabIndex={-1}>
        <Form
          id={FORM_ID}
          initialValues={initialValues}
          onSubmit={onSubmit}
          className="h-full flex flex-col"
        >
          {({ values, initialValues, resetForm }: any) => {
            // [Alaister] although this "technically" is breaking the rules of React hooks
            // it won't error because the hooks are always rendered in the same order
            // eslint-disable-next-line react-hooks/rules-of-hooks
            const [loadingSecrets, setLoadingSecrets] = useState(false)

            const initialTables = formatWrapperTables({
              handler: wrapper.handler,
              tables: wrapper?.tables ?? [],
            })
            const hasFormChanges = JSON.stringify(values) !== JSON.stringify(initialValues)
            const hasTableChanges = JSON.stringify(initialTables) !== JSON.stringify(wrapperTables)
            const hasChanges = hasFormChanges || hasTableChanges

            const encryptedOptions = wrapperMeta.server.options.filter((option) => option.encrypted)

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

            // [Alaister] although this "technically" is breaking the rules of React hooks
            // it won't error because the hooks are always rendered in the same order
            // eslint-disable-next-line react-hooks/rules-of-hooks
            useEffect(() => {
              const fetchEncryptedValues = async () => {
                setLoadingSecrets(true)
                // If the secrets haven't loaded, escape and run the effect again when they're loaded
                if (isSecretsLoading) {
                  return
                }

                const res = await Promise.all(
                  encryptedOptions.map(async (option) => {
                    const secret = secrets?.find(
                      (secret) => secret.name === `${wrapper.name}_${option.name}`
                    )
                    if (secret !== undefined) {
                      const value = await getDecryptedValue({
                        projectRef: project?.ref,
                        connectionString: project?.connectionString,
                        id: secret.id,
                      })
                      return { [option.name]: value[0]?.decrypted_secret ?? '' }
                    } else {
                      return { [option.name]: '' }
                    }
                  })
                )
                const secretValues = res.reduce((a: any, b: any) => {
                  const [key] = Object.keys(b)
                  return { ...a, [key]: b[key] }
                }, {})

                resetForm({
                  values: { ...values, ...secretValues },
                  initialValues: { ...initialValues, ...secretValues },
                })
                setLoadingSecrets(false)
              }

              if (encryptedOptions.length > 0) fetchEncryptedValues()
            }, [isSecretsLoading])

            return (
              <>
                <SheetHeader>
                  <SheetTitle>
                    Edit {wrapperMeta.label} wrapper: {wrapper.name}
                  </SheetTitle>
                </SheetHeader>
                <div className="flex-grow overflow-y-auto">
                  <FormSection header={<FormSectionLabel>Wrapper Configuration</FormSectionLabel>}>
                    <FormSectionContent loading={false}>
                      <Input
                        id="wrapper_name"
                        label="Wrapper Name"
                        error={formErrors.wrapper_name}
                        descriptionText={
                          values.wrapper_name !== initialValues.wrapper_name ? (
                            <>
                              Your wrapper's server name will be updated to{' '}
                              <code className="text-xs">{values.wrapper_name}_server</code>
                            </>
                          ) : (
                            <>
                              Your wrapper's server name is{' '}
                              <code className="text-xs">{values.wrapper_name}_server</code>
                            </>
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
                            loading={option.encrypted ? loadingSecrets : false}
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
                      {wrapperTables.length === 0 ? (
                        <div className="flex justify-end translate-y-4">
                          <Button type="default" onClick={() => setIsEditingTable(true)}>
                            Add foreign table
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {wrapperTables.map((table, i) => {
                            const target = table?.table ?? table.object

                            return (
                              <div
                                key={`${table.schema_name}.${table.table_name}`}
                                className="flex items-center justify-between px-4 py-2 border rounded-md border-control"
                              >
                                <div>
                                  <p className="text-sm">
                                    {table.schema_name}.{table.table_name}{' '}
                                  </p>
                                  <p className="text-sm text-foreground-light mt-1">
                                    Target: {target}
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
                                      setWrapperTables((prev) => prev.filter((_, j) => j !== i))
                                    }}
                                  />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                      {wrapperTables.length > 0 && (
                        <div className="flex justify-end">
                          <Button type="default" onClick={() => setIsEditingTable(true)}>
                            Add foreign table
                          </Button>
                        </div>
                      )}
                      {wrapperTables.length === 0 && formErrors.tables && (
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
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="tiny"
                    type="primary"
                    form={FORM_ID}
                    htmlType="submit"
                    disabled={isSaving}
                    loading={isSaving}
                  >
                    Save wrapper
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
