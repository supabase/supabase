import { zodResolver } from '@hookform/resolvers/zod'
import { acceptUntrustedSql, untrustedSql } from '@supabase/pg-meta/src/pg-format'
import { isEmpty, isNull, keyBy, mapValues, partition } from 'lodash'
import { Plus, Trash } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { SubmitHandler, useFieldArray, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Button,
  cn,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  RadioGroupStacked,
  RadioGroupStackedItem,
  ScrollArea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Sheet,
  SheetContent,
  SheetFooter,
  SheetSection,
  Switch,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import z from 'zod'

import { convertArgumentTypes, convertConfigParams } from '../Functions.utils'
import { CreateFunctionConfigParamsSection } from './CreateFunctionConfigParamsSection'
import { CreateFunctionHeader } from './CreateFunctionHeader'
import { FunctionEditor } from './FunctionEditor'
import { POSTGRES_DATA_TYPES } from '@/components/interfaces/TableGridEditor/SidePanelEditor/SidePanelEditor.constants'
import { DiscardChangesConfirmationDialog } from '@/components/ui-patterns/Dialogs/DiscardChangesConfirmationDialog'
import SchemaSelector from '@/components/ui/SchemaSelector'
import { useDatabaseExtensionsQuery } from '@/data/database-extensions/database-extensions-query'
import { useDatabaseFunctionCreateMutation } from '@/data/database-functions/database-functions-create-mutation'
import type { SavedDatabaseFunction } from '@/data/database-functions/database-functions-query'
import { useDatabaseFunctionUpdateMutation } from '@/data/database-functions/database-functions-update-mutation'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useConfirmOnClose } from '@/hooks/ui/useConfirmOnClose'
import { useProtectedSchemas } from '@/hooks/useProtectedSchemas'
import type { FormSchema } from '@/types'

const FORM_ID = 'create-function-sidepanel'

interface CreateFunctionProps {
  func?: SavedDatabaseFunction
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

  const { confirmOnClose, handleOpenChange, modalProps } = useConfirmOnClose({
    checkIsDirty: () => form.formState.isDirty,
    onClose,
  })

  const { mutate: createDatabaseFunction, isPending: isCreating } =
    useDatabaseFunctionCreateMutation()
  const { mutate: updateDatabaseFunction, isPending: isUpdating } =
    useDatabaseFunctionUpdateMutation()

  const onSubmit: SubmitHandler<z.infer<typeof FormSchema>> = async (data) => {
    if (!project) return console.error('Project is required')
    // Submit click is the explicit user gesture that promotes form-entered SQL fragments
    // (`args` items, `return_type`, and each `config_params` value) to executable.
    const payload = {
      ...data,
      args: data.args.map((x) => acceptUntrustedSql(untrustedSql(`${x.name} ${x.type}`))),
      return_type: acceptUntrustedSql(untrustedSql(data.return_type)),
      config_params: mapValues(keyBy(data.config_params, 'name'), (item) =>
        acceptUntrustedSql(untrustedSql(item.value))
      ),
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
    <Sheet open={visible} onOpenChange={handleOpenChange}>
      <SheetContent
        showClose={false}
        size={'default'}
        className={'p-0 flex flex-row gap-0 min-w-screen! lg:min-w-[600px]!'}
      >
        <div className="flex flex-col grow w-full">
          <CreateFunctionHeader selectedFunction={func?.name} isDuplicating={isDuplicating} />
          <Separator />
          <Form {...form}>
            <form
              id={FORM_ID}
              className="grow overflow-auto"
              onSubmit={form.handleSubmit(onSubmit)}
            >
              <SheetSection className={focusedEditor ? 'hidden' : ''}>
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItemLayout
                      label="Name of function"
                      description="Name will also be used for the function name in postgres"
                      layout="horizontal"
                    >
                      <FormControl>
                        <Input {...field} placeholder="Name of function" />
                      </FormControl>
                    </FormItemLayout>
                  )}
                />
              </SheetSection>
              <Separator className={focusedEditor ? 'hidden' : ''} />
              <SheetSection className={focusedEditor ? 'hidden' : 'space-y-4'}>
                <FormField
                  control={form.control}
                  name="schema"
                  render={({ field }) => (
                    <FormItemLayout
                      label="Schema"
                      description="Tables made in the table editor will be in 'public'"
                      layout="horizontal"
                    >
                      <FormControl>
                        <SchemaSelector
                          selectedSchemaName={field.value}
                          excludedSchemas={protectedSchemas?.map((s) => s.name)}
                          size="small"
                          onSelectSchema={(name) => field.onChange(name)}
                        />
                      </FormControl>
                    </FormItemLayout>
                  )}
                />
                {!isEditing && (
                  <FormField
                    control={form.control}
                    name="return_type"
                    render={({ field }) => (
                      <FormItemLayout label="Return type" layout="horizontal">
                        {/* Form selects don't need form controls, otherwise the CSS gets weird */}
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger className="col-span-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <ScrollArea className="h-52">
                              {['void', 'record', 'trigger', 'integer', ...POSTGRES_DATA_TYPES].map(
                                (option) => (
                                  <SelectItem value={option} key={option}>
                                    {option}
                                  </SelectItem>
                                )
                              )}
                            </ScrollArea>
                          </SelectContent>
                        </Select>
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
              <SheetSection className={`${focusedEditor ? 'h-full' : ''} px-0!`}>
                <FormField
                  control={form.control}
                  name="definition"
                  render={({ field }) => (
                    <FormItem className="space-y-4 flex flex-col h-full">
                      <div className="px-content">
                        <FormLabel className="text-base text-foreground">Definition</FormLabel>
                        <FormDescription className="text-sm text-foreground-light">
                          <p>
                            The language below should be written in <code>{language}</code>.
                          </p>
                          {!isEditing && <p>Change the language in the Advanced Settings below.</p>}
                        </FormDescription>
                      </div>
                      <div
                        className={cn(
                          'border border-default flex',
                          focusedEditor ? 'grow ' : 'h-72'
                        )}
                      >
                        <FunctionEditor
                          field={field}
                          language={language}
                          focused={focusedEditor}
                          setFocused={setFocusedEditor}
                        />
                      </div>

                      <FormMessage className="px-content" />
                    </FormItem>
                  )}
                />
              </SheetSection>
              <Separator className={focusedEditor ? 'hidden' : ''} />
              {isEditing ? (
                <></>
              ) : (
                <>
                  <SheetSection className={focusedEditor ? 'hidden' : ''}>
                    <div className="space-y-8 rounded-sm bg-studio py-4 px-6 border border-overlay">
                      <FormItem className="flex flex-row items-center justify-between">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Show advanced settings</FormLabel>
                          <FormDescription>
                            These are settings that might be familiar for Postgres developers
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={advancedSettingsShown}
                            onCheckedChange={(checked) => setAdvancedSettingsShown(checked)}
                          />
                        </FormControl>
                      </FormItem>
                    </div>
                  </SheetSection>
                  {advancedSettingsShown && (
                    <>
                      <SheetSection className={focusedEditor ? 'hidden' : 'space-y-2 pt-0'}>
                        <FormFieldLanguage />
                        <FormField
                          control={form.control}
                          name="behavior"
                          render={({ field }) => (
                            <FormItemLayout label="Behavior" layout="horizontal">
                              {/* Form selects don't need form controls, otherwise the CSS gets weird */}
                              <Select defaultValue={field.value} onValueChange={field.onChange}>
                                <SelectTrigger className="col-span-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="IMMUTABLE" key="IMMUTABLE">
                                    immutable
                                  </SelectItem>
                                  <SelectItem value="STABLE" key="STABLE">
                                    stable
                                  </SelectItem>
                                  <SelectItem value="VOLATILE" key="VOLATILE">
                                    volatile
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </FormItemLayout>
                          )}
                        />
                      </SheetSection>
                      <Separator className={focusedEditor ? 'hidden' : ''} />
                      <SheetSection className={focusedEditor ? 'hidden' : ''}>
                        <CreateFunctionConfigParamsSection />
                      </SheetSection>
                      <Separator className={focusedEditor ? 'hidden' : ''} />
                      <SheetSection className={focusedEditor ? 'hidden' : ''}>
                        <h5 className="text-base text-foreground mb-4">Type of Security</h5>
                        <FormField
                          control={form.control}
                          name="security_definer"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl className="col-span-8">
                                <RadioGroupStacked
                                  onValueChange={(value) =>
                                    field.onChange(value == 'SECURITY_DEFINER')
                                  }
                                  value={field.value ? 'SECURITY_DEFINER' : 'SECURITY_INVOKER'}
                                >
                                  <RadioGroupStackedItem
                                    value="SECURITY_INVOKER"
                                    id="SECURITY_INVOKER"
                                    label="SECURITY INVOKER"
                                    description={
                                      <>
                                        Function is to be executed with the privileges of the user
                                        that <span className="text-foreground">calls it</span>.
                                      </>
                                    }
                                  />
                                  <RadioGroupStackedItem
                                    value="SECURITY_DEFINER"
                                    id="SECURITY_DEFINER"
                                    label="SECURITY DEFINER"
                                    description={
                                      <>
                                        Function is to be executed with the privileges of the user
                                        that <span className="text-foreground">created it</span>.
                                      </>
                                    }
                                  />
                                </RadioGroupStacked>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </SheetSection>
                    </>
                  )}
                </>
              )}
            </form>
          </Form>
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
        <DiscardChangesConfirmationDialog {...modalProps} />
      </SheetContent>
    </Sheet>
  )
}

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
              <FormField
                name={`args.${index}.name`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input {...field} disabled={readonly} placeholder="argument_name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name={`args.${index}.type`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      {readonly ? (
                        <Input value={field.value} disabled readOnly className="h-auto" />
                      ) : (
                        <>
                          <Select
                            disabled={readonly}
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <SelectTrigger className="h-[38px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <ScrollArea className="h-52">
                                {['integer', ...POSTGRES_DATA_TYPES].map((option) => (
                                  <SelectItem value={option} key={option}>
                                    {option}
                                  </SelectItem>
                                ))}
                              </ScrollArea>
                            </SelectContent>
                          </Select>
                        </>
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
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
    <FormField
      name="language"
      render={({ field }) => (
        <FormItemLayout label="Language" layout="horizontal">
          {/* Form selects don't need form controls, otherwise the CSS gets weird */}
          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <SelectTrigger className="col-span-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {allowedLanguages.map((option) => (
                <SelectItem value={option} key={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormItemLayout>
      )}
    />
  )
}
