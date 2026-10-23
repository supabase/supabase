import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { compact } from 'lodash'
import { useEffect, useMemo, useState } from 'react'
import { SubmitHandler, useFieldArray, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Button,
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

import { ForeignTablesSelector } from './ForeignTablesSelector'
import { InputField } from './InputField'
import { WrapperMeta } from './Wrappers.types'
import {
  convertKVStringArrayToJson,
  FormattedWrapperTable,
  formatWrapperTables,
  getEditionFormSchema,
} from './Wrappers.utils'
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

  const [secretsReady, setSecretsReady] = useState(false)
  const [isLoadingSecrets, setIsLoadingSecrets] = useState(false)
  const [isUpdateConfirmationOpen, setIsUpdateConfirmationOpen] = useState(false)

  const { mutate: updateFDW, isPending: isSaving } = useFDWUpdateMutation({
    onSuccess: () => {
      toast.success(`Successfully updated ${wrapperMeta?.label} foreign data wrapper`)
      const { tables } = getValues()
      const hasNewSchema = (tables as Record<string, any>[]).some((table) => table.is_new_schema)
      if (hasNewSchema) invalidateSchemasQuery(queryClient, project?.ref)

      onClose()
    },
  })

  const initialValues: Record<string, any> = useMemo(
    () => ({
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
    keyName: '_fieldId',
  })

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
    let isCurrent = true

    const encryptedOptions = wrapperMeta.server.options.filter((option) => option.encrypted)

    const encryptedIdsToFetch = compact(
      encryptedOptions.map((option) => {
        const value = initialValues[option.name]
        return value ?? null
      })
    ).filter((x) => UUID_REGEX.test(x))

    if (encryptedIdsToFetch.length === 0) {
      setIsLoadingSecrets(false)
      setSecretsReady(true)
      return
    }

    setSecretsReady(false)

    const fetchEncryptedValues = async (ids: string[]) => {
      try {
        setIsLoadingSecrets(true)
        // If the secrets haven't loaded, escape and run the effect again when they're loaded
        const decryptedValues = await getDecryptedValues({
          projectRef: project?.ref,
          connectionString: project?.connectionString,
          ids: ids,
        })
        if (!isCurrent) return

        encryptedOptions.forEach((option) => {
          const encryptedId = initialValues[option.name]

          resetField(option.name, { defaultValue: decryptedValues[encryptedId] })
        })
        setSecretsReady(true)
      } catch (error) {
        if (!isCurrent) return
        toast.error('Failed to fetch encrypted values')
      } finally {
        if (isCurrent) setIsLoadingSecrets(false)
      }
    }

    fetchEncryptedValues(encryptedIdsToFetch)

    return () => {
      isCurrent = false
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
                Edit {wrapperMeta.label} wrapper connection: {wrapper.server_name}
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
                        placeholder={option.defaultValue}
                        loading={option.secureEntry ? isLoadingSecrets : undefined}
                      />
                    ))}
                </FormSectionContent>
              </FormSection>

              <Separator />

              <FormSection>
                <FormSectionContent className="flex flex-col space-y-2" loading={false}>
                  <ForeignTablesSelector
                    // getEditionFormSchema's option fields are dynamic (index signature),
                    // which defeats RHF's field-array type inference.
                    tables={tablesField as unknown as FormattedWrapperTable[]}
                    wrapperTables={wrapperMeta.tables}
                    errorMessage={errors.tables?.message?.toString()}
                    onAppend={appendTable}
                    onUpdate={updateTable}
                    onRemove={removeTable}
                  />
                </FormSectionContent>
              </FormSection>
            </div>
            <SheetFooter>
              <Button size="tiny" type="button" onClick={confirmOnClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <ButtonTooltip
                size="tiny"
                variant="primary"
                form={FORM_ID}
                type="submit"
                disabled={isSubmitting || !isDirty || !secretsReady}
                loading={isSubmitting}
                tooltip={{
                  content: {
                    side: 'top',
                    text: !secretsReady ? 'Waiting for encrypted values to load' : undefined,
                  },
                }}
              >
                Save wrapper
              </ButtonTooltip>
            </SheetFooter>
          </form>
        </Form>
      </div>

      <ConfirmationModal
        visible={isUpdateConfirmationOpen}
        title="Save wrapper changes?"
        size="small"
        variant="warning"
        confirmLabel="Save changes"
        confirmLabelLoading="Saving changes"
        loading={isSaving}
        onCancel={() => {
          setIsUpdateConfirmationOpen(false)
          onClose()
        }}
        onConfirm={() => {
          const { tables, ...values } = getValues()
          const sanitizedTables = (tables as Record<string, unknown>[]).map(
            ({ _fieldId, ...table }) => table
          )
          updateFDW({
            projectRef: project?.ref,
            connectionString: project?.connectionString,
            wrapper,
            wrapperMeta,
            formState: values,
            tables: sanitizedTables,
          })
          setIsUpdateConfirmationOpen(false)
        }}
      >
        <p className="text-sm text-foreground-light">
          Removing a table or retyping a column may break views or functions that reference it.
        </p>
        <p className="text-sm text-foreground-light mt-2">Are you sure you want to continue?</p>
      </ConfirmationModal>

      <DiscardChangesConfirmationDialog {...modalProps} />
    </>
  )
}
