import { zodResolver } from '@hookform/resolvers/zod'
import { isEmpty, isNull, keyBy, mapValues, partition } from 'lodash'
import { Plus, Trash } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { SubmitHandler, useFieldArray, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import z from 'zod'

import { POSTGRES_DATA_TYPES } from 'components/interfaces/TableGridEditor/SidePanelEditor/SidePanelEditor.constants'
import SchemaSelector from 'components/ui/SchemaSelector'
import { useDatabaseExtensionsQuery } from 'data/database-extensions/database-extensions-query'
import { useDatabaseFunctionCreateMutation } from 'data/database-functions/database-functions-create-mutation'
import { DatabaseFunction } from 'data/database-functions/database-functions-query'
import { useDatabaseFunctionUpdateMutation } from 'data/database-functions/database-functions-update-mutation'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useConfirmOnClose, type ConfirmOnCloseModalProps } from 'hooks/ui/useConfirmOnClose'
import { useProtectedSchemas } from 'hooks/useProtectedSchemas'
import type { FormSchema } from 'types'
import {
  Button,
  FormControl_Shadcn_,
  FormDescription_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  FormLabel_Shadcn_,
  FormMessage_Shadcn_,
  Form_Shadcn_,
  Input_Shadcn_,
  Label_Shadcn_,
  RadioGroupItem_Shadcn_,
  RadioGroup_Shadcn_,
  ScrollArea,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Select_Shadcn_,
  Separator,
  Sheet,
  SheetContent,
  SheetFooter,
  SheetSection,
  Toggle,
  cn,
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { convertArgumentTypes, convertConfigParams } from '../Functions.utils'
import { CreateFunctionHeader } from './CreateFunctionHeader'
import { FunctionEditor } from './FunctionEditor'

const FORM_ID = 'create-function-sidepanel'

interface CreateFunctionProps {
  func?: DatabaseFunction
  isDuplicating?: boolean
  visible: boolean
  onClose: () => void
}

const FormSchema = z.object({
  name: z.string().trim().min(1),
  schema: z.string().trim().min(1),
  args: z.array(z.object({ name: z.string().trim().min(1), type: z.string().trim() })),
  behavior: z.enum(['IMMUTABLE', 'STABLE', 'VOLATILE']),
  definition: z.string().trim().min(1),
  language: z.string().trim(),
  return_type: z.string().trim(),
  security_definer: z.boolean(),
  config_params: z
    .array(z.object({ name: z.string().trim().min(1), value: z.string().trim().min(1) }))
    .optional(),
})

export const CreateFunction = ({
  func,
  visible,
  isDuplicating = false,
  onClose,
}: CreateFunctionProps) => {
  const { data: project } = useSelectedProjectQuery()
  const [advancedSettingsShown, setAdvancedSettingsShown] = useState(false)
  const [focusedEditor, setFocusedEditor] = useState(false)

  const isEditing = !isDuplicating && !!func?.id

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  })
  const language = form.watch('language')

  const { confirmOnClose, modalProps: closeConfirmationModalProps } = useConfirmOnClose({
    checkIsDirty: () => form.formState.isDirty,
    onClose,
  })

  const { mutate: createDatabaseFunction, isPending: isCreating } =
    useDatabaseFunctionCreateMutation()
  const { mutate: updateDatabaseFunction, isPending: isUpdating } =
    useDatabaseFunctionUpdateMutation()

  const onSubmit: SubmitHandler<z.infer<typeof FormSchema>> = async (data) => {
    if (!project) return console.error('Project is required')
    const payload = {
      ...data,
      args: data.args.map((x) => `${x.name} ${x.type}`),
      config_params: mapValues(keyBy(data.config_params, 'name'), 'value') as Record<string, never>,
    }

    if (isEditing) {
      updateDatabaseFunction(
        {
          func,
          projectRef: project.ref,
          connectionString: project.connectionString,
          payload,
        },
        {
          onSuccess: () => {
            toast.success(`Successfully updated function ${data.name}`)
            onClose()
          },
        }
      )
    } else {
      createDatabaseFunction(
        {
          projectRef: project.ref,
          connectionString: project.connectionString,
          payload,
        },
        {
          onSuccess: () => {
            toast.success(`Successfully created function ${data.name}`)
            onClose()
          },
        }
      )
    }
  }

  useEffect(() => {
    if (visible) {
      setFocusedEditor(false)
      form.reset({
        name: func?.name ?? '',
        schema: func?.schema ?? 'public',
        args: convertArgumentTypes(func?.argument_types || '').value,
        behavior: func?.behavior ?? 'VOLATILE',
        definition: func?.definition ?? '',
        language: func?.language ?? 'plpgsql',
        return_type: func?.return_type ?? 'void',
        security_definer: func?.security_definer ?? false,
        config_params: convertConfigParams(func?.config_params).value,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, func?.id])

  const { data: protectedSchemas } = useProtectedSchemas()

  return (
    <Sheet open={visible} onOpenChange={confirmOnClose}>
      <SheetContent
        showClose={false}
        size={'default'}
        className={'p-0 flex flex-row gap-0 !min-w-screen lg:!min-w-[600px]'}
      >
        <div className="flex flex-col grow w-full">
          <CreateFunctionHeader selectedFunction={func?.name} isDuplicating={isDuplicating} />
          <Separator />
          <Form_Shadcn_ {...form}>
            <form
              id={FORM_ID}
              className="flex-grow overflow-auto"
              onSubmit={form.handleSubmit(onSubmit)}
            >
              <SheetSection className={focusedEditor ? 'hidden' : ''}>
                <FormField_Shadcn_
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItemLayout
                      label="Name of function"
                      description="Name will also be used for the function name in postgres"
                      layout="horizontal"
                    >
                      <FormControl_Shadcn_>
                        <Input_Shadcn_ {...field} placeholder="Name of function" />
                      </FormControl_Shadcn_>
                    </FormItemLayout>
                  )}
                />
              </SheetSection>
              <Separator className={focusedEditor ? 'hidden' : ''} />
              <SheetSection className={focusedEditor ? 'hidden' : 'space-y-4'}>
                <FormField_Shadcn_
                  control={form.control}
                  name="schema"
                  render={({ field }) => (
                    <FormItemLayout
                      label="Schema"
                      description="Tables made in the table editor will be in 'public'"
                      layout="horizontal"
                    >
                      <FormControl_Shadcn_>
                        <SchemaSelector
                          selectedSchemaName={field.value}
                          excludedSchemas={protectedSchemas?.map((s) => s.name)}
                          size="small"
                          onSelectSchema={(name) => field.onChange(name)}
                        />
                      </FormControl_Shadcn_>
                    </FormItemLayout>
                  )}
                />
                {!isEditing && (
                  <FormField_Shadcn_
                    control={form.control}
                    name="return_type"
                    render={({ field }) => (
                      <FormItemLayout label="Return type" layout="horizontal">
                        {/* Form selects don't need form controls, otherwise the CSS gets weird */}
                        <Select_Shadcn_ onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger_Shadcn_ className="col-span-8">
                            <SelectValue_Shadcn_ />
                          </SelectTrigger_Shadcn_>
                          <SelectContent_Shadcn_>
                            <ScrollArea className="h-52">
                              {['void', 'record', 'trigger', 'integer', ...POSTGRES_DATA_TYPES].map(
                                (option) => (
                                  <SelectItem_Shadcn_ value={option} key={option}>
                                    {option}
                                  </SelectItem_Shadcn_>
                                )
                              )}
                            </ScrollArea>
                          </SelectContent_Shadcn_>
                        </Select_Shadcn_>
                      </FormItemLayout>
                    )}
                  />
                )}
              </SheetSection>
              <Separator className={focusedEditor ? 'hidden' : ''} />
              <SheetSection className={focusedEditor ? 'hidden' : ''}>
                <FormFieldArgs readonly={isEditing} />
              </SheetSection>
              <Separator className={focusedEditor ? 'hidden' : ''} />
              <SheetSection className={`${focusedEditor ? 'h-full' : ''} !px-0`}>
                <FormField_Shadcn_
                  control={form.control}
                  name="definition"
                  render={({ field }) => (
                    <FormItem_Shadcn_ className="space-y-4 flex flex-col h-full">
                      <div className="px-content">
                        <FormLabel_Shadcn_ className="text-base text-foreground">
                          Definition
                        </FormLabel_Shadcn_>
                        <FormDescription_Shadcn_ className="text-sm text-foreground-light">
                          <p>
                            The language below should be written in <code>{language}</code>.
                          </p>
                          {!isEditing && <p>Change the language in the Advanced Settings below.</p>}
                        </FormDescription_Shadcn_>
                      </div>
                      <div
                        className={cn(
                          'border border-default flex',
                          focusedEditor ? 'flex-grow ' : 'h-72'
                        )}
                      >
                        <FunctionEditor
                          field={field}
                          language={language}
                          focused={focusedEditor}
                          setFocused={setFocusedEditor}
                        />
                      </div>

                      <FormMessage_Shadcn_ className="px-content" />
                    </FormItem_Shadcn_>
                  )}
                />
              </SheetSection>
              <Separator className={focusedEditor ? 'hidden' : ''} />
              {isEditing ? (
                <></>
              ) : (
                <>
                  <SheetSection className={focusedEditor ? 'hidden' : ''}>
                    <div className="space-y-8 rounded bg-studio py-4 px-6 border border-overlay">
                      <Toggle
                        onChange={() => setAdvancedSettingsShown(!advancedSettingsShown)}
                        label="Show advanced settings"
                        checked={advancedSettingsShown}
                        labelOptional="These are settings that might be familiar for Postgres developers"
                      />
                    </div>
                  </SheetSection>
                  {advancedSettingsShown && (
                    <>
                      <SheetSection className={focusedEditor ? 'hidden' : 'space-y-2 pt-0'}>
                        <FormFieldLanguage />
                        <FormField_Shadcn_
                          control={form.control}
                          name="behavior"
                          render={({ field }) => (
                            <FormItemLayout label="Behavior" layout="horizontal">
                              {/* Form selects don't need form controls, otherwise the CSS gets weird */}
                              <Select_Shadcn_
                                defaultValue={field.value}
                                onValueChange={field.onChange}
                              >
                                <SelectTrigger_Shadcn_ className="col-span-8">
                                  <SelectValue_Shadcn_ />
                                </SelectTrigger_Shadcn_>
                                <SelectContent_Shadcn_>
                                  <SelectItem_Shadcn_ value="IMMUTABLE" key="IMMUTABLE">
                                    immutable
                                  </SelectItem_Shadcn_>
                                  <SelectItem_Shadcn_ value="STABLE" key="STABLE">
                                    stable
                                  </SelectItem_Shadcn_>
                                  <SelectItem_Shadcn_ value="VOLATILE" key="VOLATILE">
                                    volatile
                                  </SelectItem_Shadcn_>
                                </SelectContent_Shadcn_>
                              </Select_Shadcn_>
                            </FormItemLayout>
                          )}
                        />
                      </SheetSection>
                      <Separator className={focusedEditor ? 'hidden' : ''} />
                      <SheetSection className={focusedEditor ? 'hidden' : ''}>
                        <FormFieldConfigParams readonly={isEditing} />
                      </SheetSection>
                      <Separator className={focusedEditor ? 'hidden' : ''} />
                      <SheetSection className={focusedEditor ? 'hidden' : ''}>
                        <h5 className="text-base text-foreground mb-4">Type of Security</h5>
                        <FormField_Shadcn_
                          control={form.control}
                          name="security_definer"
                          render={({ field }) => (
                            <FormItem_Shadcn_>
                              <FormControl_Shadcn_ className="col-span-8">
                                <RadioGroup_Shadcn_
                                  className="gap-0"
                                  onValueChange={(value) =>
                                    field.onChange(value === 'SECURITY_DEFINER')
                                  }
                                  value={field.value ? 'SECURITY_DEFINER' : 'SECURITY_INVOKER'}
                                >
                                  <Label_Shadcn_
                                    className={cn(
                                      'relative cursor-pointer transition border rounded-tl-md rounded-tr-md px-6 py-4',
                                      !field.value
                                        ? 'bg-selection z-10 border-stronger'
                                        : 'bg-surface-200 border-alternative hover:border-strong hover:bg-surface-300'
                                    )}
                                  >
                                    <RadioGroupItem_Shadcn_
                                      value="SECURITY_INVOKER"
                                      checked={!field.value}
                                      className="absolute h-4 w-4 opacity-0"
                                    />
                                    <div className="text-foreground-light cursor-pointer text-sm flex flex-col space-y-1">
                                      <div>SECURITY INVOKER</div>
                                      <div className="text-foreground-lighter text-sm">
                                        Function is to be executed with the privileges of the user
                                        that <span className="text-foreground">calls it</span>.
                                      </div>
                                    </div>
                                  </Label_Shadcn_>

                                  <Label_Shadcn_
                                    className={cn(
                                      'relative cursor-pointer transition border rounded-bl-md rounded-br-md px-6 py-4',
                                      field.value
                                        ? 'bg-selection z-10 border-stronger'
                                        : 'bg-surface-200 border-alternative hover:border-strong hover:bg-surface-300'
                                    )}
                                  >
                                    <RadioGroupItem_Shadcn_
                                      value="SECURITY_DEFINER"
                                      checked={field.value}
                                      className="absolute h-4 w-4 opacity-0"
                                    />
                                    <div className="text-foreground-light cursor-pointer text-sm flex flex-col space-y-1">
                                      <div>SECURITY DEFINER</div>
                                      <div className="text-foreground-lighter text-sm">
                                        Function is to be executed with the privileges of the user
                                        that <span className="text-foreground">created it</span>.
                                      </div>
                                    </div>
                                  </Label_Shadcn_>
                                </RadioGroup_Shadcn_>
                              </FormControl_Shadcn_>
                            </FormItem_Shadcn_>
                          )}
                        />
                      </SheetSection>
                    </>
                  )}
                </>
              )}
            </form>
          </Form_Shadcn_>
          <SheetFooter>
            <Button disabled={isCreating || isUpdating} type="default" onClick={confirmOnClose}>
              Cancel
            </Button>
            <Button
              form={FORM_ID}
              htmlType="submit"
              disabled={isCreating || isUpdating}
              loading={isCreating || isUpdating}
            >
              {isEditing ? 'Save' : 'Create'} function
            </Button>
          </SheetFooter>
        </div>
        <CloseConfirmationModal {...closeConfirmationModalProps} />
      </SheetContent>
    </Sheet>
  )
}

const CloseConfirmationModal = ({ visible, onClose, onCancel }: ConfirmOnCloseModalProps) => (
  <ConfirmationModal
    visible={visible}
    title="Discard changes"
    confirmLabel="Discard"
    onCancel={onCancel}
    onConfirm={onClose}
  >
    <p className="text-sm text-foreground-light">
      There are unsaved changes. Are you sure you want to close the panel? Your changes will be
      lost.
    </p>
  </ConfirmationModal>
)

interface FormFieldConfigParamsProps {
  readonly?: boolean
}

const FormFieldArgs = ({ readonly }: FormFieldConfigParamsProps) => {
  const { fields, append, remove } = useFieldArray<z.infer<typeof FormSchema>>({
    name: 'args',
  })

  return (
    <>
      <div className="flex flex-col">
        <h5 className="text-base text-foreground">Arguments</h5>
        <p className="text-sm text-foreground-light">
          Arguments can be referenced in the function body using either names or numbers.
        </p>
      </div>
      <div className="space-y-2 pt-4">
        {readonly && isEmpty(fields) && (
          <span className="text-foreground-lighter">No argument for this function</span>
        )}
        {fields.map((field, index) => {
          return (
            <div className="flex flex-row space-x-1" key={field.id}>
              <FormField_Shadcn_
                name={`args.${index}.name`}
                render={({ field }) => (
                  <FormItem_Shadcn_ className="flex-1">
                    <FormControl_Shadcn_>
                      <Input_Shadcn_ {...field} disabled={readonly} placeholder="argument_name" />
                    </FormControl_Shadcn_>
                    <FormMessage_Shadcn_ />
                  </FormItem_Shadcn_>
                )}
              />
              <FormField_Shadcn_
                name={`args.${index}.type`}
                render={({ field }) => (
                  <FormItem_Shadcn_ className="flex-1">
                    <FormControl_Shadcn_>
                      {readonly ? (
                        <Input_Shadcn_ value={field.value} disabled readOnly className="h-auto" />
                      ) : (
                        <>
                          <Select_Shadcn_
                            disabled={readonly}
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <SelectTrigger_Shadcn_ className="h-[38px]">
                              <SelectValue_Shadcn_ />
                            </SelectTrigger_Shadcn_>
                            <SelectContent_Shadcn_>
                              <ScrollArea className="h-52">
                                {['integer', ...POSTGRES_DATA_TYPES].map((option) => (
                                  <SelectItem_Shadcn_ value={option} key={option}>
                                    {option}
                                  </SelectItem_Shadcn_>
                                ))}
                              </ScrollArea>
                            </SelectContent_Shadcn_>
                          </Select_Shadcn_>
                        </>
                      )}
                    </FormControl_Shadcn_>
                    <FormMessage_Shadcn_ />
                  </FormItem_Shadcn_>
                )}
              />

              {!readonly && (
                <Button
                  type="danger"
                  icon={<Trash size={12} />}
                  onClick={() => remove(index)}
                  className="h-[38px] w-[38px]"
                />
              )}
            </div>
          )
        })}

        {!readonly && (
          <Button
            type="default"
            icon={<Plus size={12} />}
            onClick={() => append({ name: '', type: 'integer' })}
            disabled={readonly}
          >
            Add a new argument
          </Button>
        )}
      </div>
    </>
  )
}

interface FormFieldConfigParamsProps {
  readonly?: boolean
}

const FormFieldConfigParams = ({ readonly }: FormFieldConfigParamsProps) => {
  const { fields, append, remove } = useFieldArray<z.infer<typeof FormSchema>>({
    name: 'config_params',
  })

  return (
    <>
      <h5 className="text-base text-foreground">Configuration Parameters</h5>
      <div className="space-y-2 pt-4">
        {readonly && isEmpty(fields) && (
          <span className="text-foreground-lighter">No argument for this function</span>
        )}
        {fields.map((field, index) => {
          return (
            <div className="flex flex-row space-x-1" key={field.id}>
              <FormField_Shadcn_
                name={`config_params.${index}.name`}
                render={({ field }) => (
                  <FormItem_Shadcn_ className="flex-1">
                    <FormControl_Shadcn_>
                      <Input_Shadcn_ {...field} placeholder="parameter_name" />
                    </FormControl_Shadcn_>
                    <FormMessage_Shadcn_ />
                  </FormItem_Shadcn_>
                )}
              />
              <FormField_Shadcn_
                name={`config_params.${index}.value`}
                render={({ field }) => (
                  <FormItem_Shadcn_ className="flex-1">
                    <FormControl_Shadcn_>
                      <Input_Shadcn_ {...field} placeholder="parameter_value" />
                    </FormControl_Shadcn_>
                    <FormMessage_Shadcn_ />
                  </FormItem_Shadcn_>
                )}
              />

              {!readonly && (
                <Button
                  type="danger"
                  icon={<Trash size={12} />}
                  onClick={() => remove(index)}
                  className="h-[38px] w-[38px]"
                />
              )}
            </div>
          )
        })}

        {!readonly && (
          <Button
            type="default"
            icon={<Plus size={12} />}
            onClick={() => append({ name: '', type: '' })}
            disabled={readonly}
          >
            Add a new config
          </Button>
        )}
      </div>
    </>
  )
}

const ALL_ALLOWED_LANGUAGES = ['plpgsql', 'sql', 'plcoffee', 'plv8', 'plls']

const FormFieldLanguage = () => {
  const { data: project } = useSelectedProjectQuery()

  const { data: enabledExtensions } = useDatabaseExtensionsQuery(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
    },
    {
      select(data) {
        return partition(data, (ext) => !isNull(ext.installed_version))[0]
      },
    }
  )

  const allowedLanguages = useMemo(() => {
    return ALL_ALLOWED_LANGUAGES.filter((lang) => {
      if (lang.startsWith('pl')) {
        return enabledExtensions?.find((ex) => ex.name === lang) !== undefined
      }

      return true
    })
  }, [enabledExtensions])

  return (
    <FormField_Shadcn_
      name="language"
      render={({ field }) => (
        <FormItemLayout label="Language" layout="horizontal">
          {/* Form selects don't need form controls, otherwise the CSS gets weird */}
          <Select_Shadcn_ onValueChange={field.onChange} defaultValue={field.value}>
            <SelectTrigger_Shadcn_ className="col-span-8">
              <SelectValue_Shadcn_ />
            </SelectTrigger_Shadcn_>
            <SelectContent_Shadcn_>
              {allowedLanguages.map((option) => (
                <SelectItem_Shadcn_ value={option} key={option}>
                  {option}
                </SelectItem_Shadcn_>
              ))}
            </SelectContent_Shadcn_>
          </Select_Shadcn_>
        </FormItemLayout>
      )}
    />
  )
}
