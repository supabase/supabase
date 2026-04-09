import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { compact } from 'lodash'
import { Edit, Trash } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { SubmitHandler, useFieldArray, useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Button,
  Card,
  CardContent,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Input_Shadcn_,
  SheetFooter,
  SheetHeader,
  SheetSection,
  SheetTitle,
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'
import * as z from 'zod'

import InputField from './InputField'
import { WrapperMeta } from './Wrappers.types'
import {
  convertKVStringArrayToJson,
  FormattedWrapperTable,
  formatWrapperTables,
  getEditionFormSchema,
  NewTable,
} from './Wrappers.utils'
import WrapperTableEditor from './WrapperTableEditor'
import { DiscardChangesConfirmationDialog } from '@/components/ui-patterns/Dialogs/DiscardChangesConfirmationDialog'
import { invalidateSchemasQuery } from '@/data/database/schemas-query'
import { useFDWUpdateMutation } from '@/data/fdw/fdw-update-mutation'
import { FDW } from '@/data/fdw/fdws-query'
import { getDecryptedValues } from '@/data/vault/vault-secret-decrypted-value-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useConfirmOnClose } from '@/hooks/ui/useConfirmOnClose'
import { UUID_REGEX } from '@/lib/constants'

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
  const { data: project } = useSelectedProjectQuery()

  const { mutate: updateFDW, isPending: isSaving } = useFDWUpdateMutation({
    onSuccess: () => {
      toast.success(`Successfully updated ${wrapperMeta?.label} foreign data wrapper`)

      const { tables } = getValues()
      const hasNewSchema = (tables as Record<string, any>[]).some((table) => table.is_new_schema)
      if (hasNewSchema) invalidateSchemasQuery(queryClient, project?.ref)
    },
  })

  const initialValues: Record<string, any> = useMemo(
    () => ({
      wrapper_name: wrapper?.name,
      server_name: wrapper?.server_name,
      ...convertKVStringArrayToJson(wrapper?.server_options ?? []),
      tables: formatWrapperTables(wrapper, wrapperMeta),
    }),
    [wrapper, wrapperMeta]
  )

  const formSchema = getEditionFormSchema(wrapperMeta)
  type FormSchema = z.infer<typeof formSchema>
  const form = useForm<FormSchema>({
    defaultValues: initialValues,
    resolver: zodResolver(formSchema),
  })

  const { getValues, reset, resetField, setError } = form
  const { errors, isDirty, isSubmitting } = form.formState

  const {
    fields: tablesField,
    append: appendTable,
    remove: removeTable,
    update: updateTable,
  } = useFieldArray({
    control: form.control,
    name: 'tables',
  })

  const [selectedTableToEdit, setSelectedTableToEdit] = useState<FormattedWrapperTable | undefined>(
    undefined
  )
  const [isUpdateConfirmationOpen, setIsUpdateConfirmationOpen] = useState(false)

  const onUpdateTable = (values: FormattedWrapperTable) => {
    if (values.index !== undefined) {
      updateTable(values.index, values)
    } else {
      appendTable(values)
    }
    setSelectedTableToEdit(undefined)
  }

  const onSubmit: SubmitHandler<FormSchema> = async (values) => {
    const { tables } = values
    if (tables.length === 0) {
      setError('tables', {
        type: 'validate',
        message: 'Please provide at least one table.',
      })
      return
    }
    setIsUpdateConfirmationOpen(true)
  }

  const { confirmOnClose, modalProps } = useConfirmOnClose({
    checkIsDirty: () => isDirty,
    onClose,
  })

  useEffect(() => {
    if (!isClosing) return
    if (isDirty) {
      confirmOnClose()
    } else {
      onClose()
    }
    setIsClosing(false)
  }, [isDirty, confirmOnClose, isClosing, onClose, setIsClosing])

  const wrapper_name = useWatch({ name: 'wrapper_name', control: form.control })

  const [isLoadingSecrets, setIsLoadingSecrets] = useState(false)
  useEffect(() => {
    const encryptedOptions = wrapperMeta.server.options.filter((option) => option.encrypted)

    const encryptedIdsToFetch = compact(
      encryptedOptions.map((option) => {
        const value = initialValues[option.name]
        return value ?? null
      })
    ).filter((x) => UUID_REGEX.test(x))
    // [Joshen] ^ Validate UUID to filter out already decrypted values

    const fetchEncryptedValues = async (ids: string[]) => {
      try {
        setIsLoadingSecrets(true)
        // If the secrets haven't loaded, escape and run the effect again when they're loaded
        const decryptedValues = await getDecryptedValues({
          projectRef: project?.ref,
          connectionString: project?.connectionString,
          ids: ids,
        })

        encryptedOptions.forEach((option) => {
          const encryptedId = initialValues[option.name]

          resetField(option.name, { defaultValue: decryptedValues[encryptedId] })
        })
      } catch (error) {
        toast.error('Failed to fetch encrypted values')
      } finally {
        setIsLoadingSecrets(false)
      }
    }

    if (encryptedIdsToFetch.length > 0) {
      fetchEncryptedValues(encryptedIdsToFetch)
    }
  }, [initialValues, wrapperMeta, resetField, project?.ref, project?.connectionString])

  return (
    <>
      <div className="flex flex-col h-full" tabIndex={-1}>
        <Form_Shadcn_ {...form}>
          <form
            id={FORM_ID}
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col h-full"
          >
            <SheetHeader>
              <SheetTitle>
                Edit {wrapperMeta.label} wrapper: {wrapper.name}
              </SheetTitle>
            </SheetHeader>
            <SheetSection className="flex-grow overflow-y-auto">
              <PageSection>
                <PageSectionMeta>
                  <PageSectionSummary>
                    <PageSectionTitle>Wrapper Configuration</PageSectionTitle>
                  </PageSectionSummary>
                </PageSectionMeta>
                <PageSectionContent>
                  <Card>
                    <CardContent>
                      <FormField_Shadcn_
                        control={form.control}
                        name="wrapper_name"
                        render={({ field }) => (
                          <FormItemLayout
                            layout="vertical"
                            label="Wrapper Name"
                            description={
                              wrapper_name !== initialValues.wrapper_name ? (
                                <>
                                  Your wrapper's server name will be updated to{' '}
                                  <code className="text-code-inline">{wrapper_name}_server</code>
                                </>
                              ) : (
                                <>
                                  Your wrapper's server name is{' '}
                                  <code className="text-code-inline">{wrapper_name}_server</code>
                                </>
                              )
                            }
                          >
                            <FormControl_Shadcn_>
                              <Input_Shadcn_ {...field} />
                            </FormControl_Shadcn_>
                          </FormItemLayout>
                        )}
                      />
                    </CardContent>
                  </Card>
                </PageSectionContent>
              </PageSection>
              <PageSection>
                <PageSectionMeta>
                  <PageSectionSummary>
                    <PageSectionTitle>{wrapperMeta.label} Configuration</PageSectionTitle>
                  </PageSectionSummary>
                </PageSectionMeta>
                <PageSectionContent>
                  <Card>
                    {wrapperMeta.server.options
                      .filter((option) => !option.hidden)
                      .map((option) => (
                        <CardContent key={option.name}>
                          <InputField
                            option={option}
                            control={form.control}
                            loading={option.secureEntry ? isLoadingSecrets : undefined}
                          />
                        </CardContent>
                      ))}
                  </Card>
                </PageSectionContent>
              </PageSection>
              <PageSection>
                <PageSectionMeta>
                  <PageSectionSummary>
                    <PageSectionTitle>Foreign Tables</PageSectionTitle>
                    <PageSectionDescription>
                      You can query your data from these foreign tables after the wrapper is created
                    </PageSectionDescription>
                  </PageSectionSummary>
                </PageSectionMeta>
                <PageSectionContent className="flex flex-col space-y-2">
                  {tablesField.map((t, tableIndex) => {
                    // FIXME: make inference work
                    const table = t as unknown as FormattedWrapperTable
                    return (
                      <div
                        key={t.id}
                        className="flex items-center justify-between px-4 py-2 border rounded-md border-control"
                      >
                        <div>
                          <p className="text-sm">
                            {table.schema_name}.{table.table_name}
                          </p>
                          <p className="text-sm text-foreground-light">
                            Columns: {table.columns.map((column: any) => column.name).join(', ')}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            type="default"
                            className="px-1"
                            icon={<Edit />}
                            onClick={() => {
                              setSelectedTableToEdit(table)
                            }}
                          />
                          <Button
                            type="default"
                            className="px-1"
                            icon={<Trash />}
                            onClick={() => {
                              removeTable(tableIndex)
                            }}
                          />
                        </div>
                      </div>
                    )
                  })}

                  <div className="flex justify-end">
                    <Button type="default" onClick={() => setSelectedTableToEdit(NewTable)}>
                      Add foreign table
                    </Button>
                  </div>
                  {tablesField.length === 0 && errors.tables && (
                    <p className="text-sm text-right text-red-900">
                      {errors.tables.message?.toString()}
                    </p>
                  )}
                </PageSectionContent>
              </PageSection>
            </SheetSection>
            <SheetFooter>
              <Button
                size="tiny"
                type="default"
                htmlType="button"
                onClick={confirmOnClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                size="tiny"
                type="primary"
                form={FORM_ID}
                htmlType="submit"
                disabled={isSubmitting || !isDirty}
                loading={isSubmitting}
              >
                Save wrapper
              </Button>
            </SheetFooter>
          </form>
        </Form_Shadcn_>
      </div>

      <ConfirmationModal
        visible={isUpdateConfirmationOpen}
        title="Recreate wrapper?"
        size="medium"
        variant="warning"
        confirmLabel="Recreate wrapper"
        confirmLabelLoading="Recreating wrapper"
        loading={isSaving}
        onCancel={() => {
          setIsUpdateConfirmationOpen(false)
          onClose()
        }}
        onConfirm={() => {
          const { tables, ...values } = getValues()
          updateFDW({
            projectRef: project?.ref,
            connectionString: project?.connectionString,
            wrapper,
            wrapperMeta,
            formState: values,
            tables,
          })
          setIsUpdateConfirmationOpen(false)
        }}
      >
        <p className="text-sm text-foreground-light">
          Saving changes will drop the existing wrapper and recreate it. Foreign servers and tables
          will be recreated, and dependent objects like functions or views that reference those
          tables may need to be updated manually afterwards.
        </p>
        <p className="text-sm text-foreground-light mt-2">Are you sure you want to continue?</p>
      </ConfirmationModal>

      <DiscardChangesConfirmationDialog {...modalProps} />

      <WrapperTableEditor
        visible={selectedTableToEdit != null}
        tables={wrapperMeta.tables}
        onCancel={() => {
          setSelectedTableToEdit(undefined)
        }}
        onSave={onUpdateTable}
        initialData={selectedTableToEdit}
      />
    </>
  )
}
