import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { compact } from 'lodash'
import { Edit, Trash } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { SubmitHandler, useFieldArray, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Button,
  cn,
  Form,
  FormControl,
  FormField,
  Input,
  Separator,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
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
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import {
  FormSection,
  FormSectionContent,
  FormSectionLabel,
} from '@/components/ui/Forms/FormSection'
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

  const [isLoadingSecrets, setIsLoadingSecrets] = useState(false)
  const [selectedTableToEdit, setSelectedTableToEdit] = useState<FormattedWrapperTable | undefined>(
    undefined
  )
  const [selectedTableFieldIndex, setSelectedTableFieldIndex] = useState<number | undefined>(
    undefined
  )
  const [isUpdateConfirmationOpen, setIsUpdateConfirmationOpen] = useState(false)

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

  const { getValues, resetField, setError } = form
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

  const onUpdateTable = (values: FormattedWrapperTable) => {
    if (selectedTableFieldIndex !== undefined) {
      updateTable(selectedTableFieldIndex, values)
    } else {
      appendTable(values)
    }
    setSelectedTableToEdit(undefined)
    setSelectedTableFieldIndex(undefined)
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
        <Form {...form}>
          <form
            id={FORM_ID}
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col h-full"
          >
            <SheetHeader>
              <SheetTitle>
                Edit {wrapperMeta.label} wrapper connection: {wrapper.name}
              </SheetTitle>
            </SheetHeader>
            <div className="grow overflow-y-auto">
              <FormSection
                className="p-5!"
                header={<FormSectionLabel>Server configuration</FormSectionLabel>}
              >
                <FormSectionContent className="flex flex-col space-y-2" loading={false}>
                  <FormField
                    control={form.control}
                    name="server_name"
                    render={({ field }) => (
                      <FormItemLayout layout="horizontal" label="Server name">
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItemLayout>
                    )}
                  />
                </FormSectionContent>
              </FormSection>
              <Separator />

              <FormSection
                header={<FormSectionLabel>{wrapperMeta.label} Configuration</FormSectionLabel>}
              >
                <FormSectionContent className="flex flex-col space-y-2" loading={false}>
                  {wrapperMeta.server.options
                    .filter((option) => !option.hidden)
                    .map((option) => (
                      <InputField
                        key={option.name}
                        option={option}
                        control={form.control}
                        loading={option.secureEntry ? isLoadingSecrets : undefined}
                      />
                    ))}
                </FormSectionContent>
              </FormSection>

              <Separator />

              <FormSection>
                <FormSectionContent className="flex flex-col space-y-2" loading={false}>
                  <FormItemLayout
                    layout="horizontal"
                    label="Foreign tables"
                    labelOptional="You can query your data from these foreign tables after the wrapper is
                                          created"
                    isReactForm={false}
                    className={cn(
                      '[&>div>span]:text-balance',
                      tablesField.length === 0 &&
                        '[&>div:last-child]:flex [&>div:last-child]:items-center [&>div:last-child]:justify-end'
                    )}
                  >
                    <div className="flex flex-col gap-y-2">
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
                                Columns:{' '}
                                {(table.columns ?? []).map((column) => column.name).join(', ')}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <ButtonTooltip
                                icon={<Edit />}
                                onClick={() => {
                                  setSelectedTableFieldIndex(tableIndex)
                                  setSelectedTableToEdit(table)
                                }}
                                tooltip={{
                                  content: {
                                    side: 'bottom',
                                    text: `Edit ${table.table_name} foreign table`,
                                  },
                                }}
                              />
                              <ButtonTooltip
                                icon={<Trash />}
                                onClick={() => removeTable(tableIndex)}
                                tooltip={{
                                  content: {
                                    side: 'bottom',
                                    text: `Remove ${table.table_name} foreign table`,
                                  },
                                }}
                              />
                            </div>
                          </div>
                        )
                      })}
                      <div className="flex justify-end">
                        <Button
                          onClick={() => {
                            setSelectedTableFieldIndex(undefined)
                            setSelectedTableToEdit(NewTable)
                          }}
                        >
                          Add foreign table
                        </Button>
                      </div>
                      {tablesField.length === 0 && errors.tables && (
                        <p className="text-sm text-right text-red-900">
                          {errors.tables.message?.toString()}
                        </p>
                      )}
                    </div>
                  </FormItemLayout>
                </FormSectionContent>
              </FormSection>
            </div>
            <SheetFooter>
              <Button size="tiny" type="button" onClick={confirmOnClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                size="tiny"
                variant="primary"
                form={FORM_ID}
                type="submit"
                disabled={isSubmitting || !isDirty}
                loading={isSubmitting}
              >
                Save wrapper
              </Button>
            </SheetFooter>
          </form>
        </Form>
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
          setSelectedTableFieldIndex(undefined)
        }}
        onSave={onUpdateTable}
        initialData={selectedTableToEdit}
      />
    </>
  )
}
