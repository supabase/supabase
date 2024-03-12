import { isEmpty, isNull, keyBy, mapValues, partition } from 'lodash'
import { useEffect, useState } from 'react'
import { SubmitHandler, useFieldArray, useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import {
  Button,
  FormControl_Shadcn_,
  FormDescription_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  FormLabel_Shadcn_,
  FormMessage_Shadcn_,
  Form_Shadcn_,
  IconPlus,
  IconTrash,
  Input_Shadcn_,
  Modal,
  Radio,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Select_Shadcn_,
  SidePanel,
  Toggle,
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import z from 'zod'

import { zodResolver } from '@hookform/resolvers/zod'
import { PostgresFunction } from '@supabase/postgres-meta'
import { POSTGRES_DATA_TYPES } from 'components/interfaces/TableGridEditor/SidePanelEditor/SidePanelEditor.constants'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import SchemaSelector from 'components/ui/SchemaSelector'
import SqlEditor from 'components/ui/SqlEditor'
import { useDatabaseExtensionsQuery } from 'data/database-extensions/database-extensions-query'
import { useDatabaseFunctionCreateMutation } from 'data/database-functions/database-functions-create-mutation'
import { useDatabaseFunctionUpdateMutation } from 'data/database-functions/database-functions-update-mutation'
import { EXCLUDED_SCHEMAS } from 'lib/constants/schemas'
import { FormSchema } from 'types'
import { convertArgumentTypes, convertConfigParams } from './Functions.utils'

const FORM_ID = 'create-function-sidepanel'

interface CreateFunctionProps {
  func?: PostgresFunction
  visible: boolean
  setVisible: (value: boolean) => void
}

const FormSchema = z.object({
  name: z.string().trim().min(1),
  schema: z.string().trim().min(1),
  args: z.array(z.object({ name: z.string().trim().min(1), type: z.string().trim() })),
  behavior: z.enum(['IMMUTABLE', 'STABLE', 'VOLATILE']),
  definition: z.string().trim(),
  language: z.string().trim(),
  return_type: z.string().trim(),
  security_definer: z.boolean(),
  config_params: z
    .array(z.object({ name: z.string().trim().min(1), value: z.string().trim().min(1) }))
    .optional(),
})

const CreateFunction = ({ func, visible, setVisible }: CreateFunctionProps) => {
  const { project } = useProjectContext()
  const [advancedSettingsShown, setAdvancedSettingsShown] = useState(false)

  const isEditing = !!func?.id

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  })

  const [isClosingPanel, setIsClosingPanel] = useState(false)

  const { mutate: createDatabaseFunction, isLoading: isCreating } =
    useDatabaseFunctionCreateMutation()
  const { mutate: updateDatabaseFunction, isLoading: isUpdating } =
    useDatabaseFunctionUpdateMutation()

  useEffect(() => {
    if (visible) {
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
  }, [visible, func])

  function isClosingSidePanel() {
    form.formState.isDirty ? setIsClosingPanel(true) : setVisible(!visible)
  }

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
          id: func.id,
          projectRef: project.ref,
          connectionString: project.connectionString,
          payload,
        },
        {
          onSuccess: () => {
            toast.success(`Successfully updated function ${data.name}`)
            setVisible(!visible)
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
            setVisible(!visible)
          },
        }
      )
    }
  }

  return (
    <SidePanel
      size="large"
      visible={visible}
      header={isEditing ? `Edit '${func.name}' function` : 'Add a new function'}
      className="mr-0 transform transition-all duration-300 ease-in-out"
      onCancel={() => isClosingSidePanel()}
      customFooter={
        <div className="flex justify-end gap-2 p-4 bg-overlay border-t border-overlay">
          <div>
            <Button disabled={isCreating || isUpdating} type="default" onClick={isClosingSidePanel}>
              Cancel
            </Button>
          </div>
          <div>
            <Button
              form={FORM_ID}
              htmlType="submit"
              disabled={isCreating || isUpdating}
              loading={isCreating || isUpdating}
            >
              Confirm
            </Button>
          </div>
        </div>
      }
    >
      <Form_Shadcn_ {...form}>
        <form id={FORM_ID} className="space-y-6 mt-4" onSubmit={form.handleSubmit(onSubmit)}>
          <SidePanel.Content>
            <FormField_Shadcn_
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem_Shadcn_ className="grid gap-2 md:grid md:grid-cols-12 space-y-0">
                  <FormLabel_Shadcn_ className="flex flex-col space-y-2 col-span-4 text-sm justify-center text-foreground-light">
                    Name of function
                  </FormLabel_Shadcn_>
                  <FormControl_Shadcn_ className="col-span-8">
                    <Input_Shadcn_ {...field} className="w-full" />
                  </FormControl_Shadcn_>
                  <FormDescription_Shadcn_ className="col-start-5 col-span-8">
                    Name will also be used for the function name in postgres
                  </FormDescription_Shadcn_>
                  <FormMessage_Shadcn_ className="col-start-5 col-span-8" />
                </FormItem_Shadcn_>
              )}
            />
          </SidePanel.Content>
          <SidePanel.Separator />
          <SidePanel.Content className="space-y-4">
            <FormField_Shadcn_
              control={form.control}
              name="schema"
              render={({ field }) => (
                <FormItem_Shadcn_ className="grid gap-2 md:grid md:grid-cols-12 space-y-0">
                  <FormLabel_Shadcn_ className="flex flex-col space-y-2 col-span-4 text-sm justify-center text-foreground-light">
                    Schema
                  </FormLabel_Shadcn_>
                  <FormControl_Shadcn_ className="col-span-8">
                    <SchemaSelector
                      selectedSchemaName={field.value}
                      excludedSchemas={EXCLUDED_SCHEMAS}
                      size="small"
                      onSelectSchema={(name) => field.onChange(name)}
                    />
                  </FormControl_Shadcn_>
                  <FormDescription_Shadcn_ className="col-start-5 col-span-8">
                    Tables made in the table editor will be in 'public'
                  </FormDescription_Shadcn_>
                  <FormMessage_Shadcn_ className="col-start-5 col-span-8" />
                </FormItem_Shadcn_>
              )}
            />
            {!isEditing && (
              <FormField_Shadcn_
                control={form.control}
                name="return_type"
                render={({ field }) => (
                  <FormItem_Shadcn_ className="grid gap-2 md:grid md:grid-cols-12 space-y-0">
                    <FormLabel_Shadcn_ className="flex flex-col space-y-2 col-span-4 text-sm justify-center text-foreground-light">
                      Return type
                    </FormLabel_Shadcn_>
                    {/* Form selects don't need form controls, otherwise the CSS get's weird */}
                    <Select_Shadcn_ onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger_Shadcn_ className="col-span-8">
                        <SelectValue_Shadcn_ />
                      </SelectTrigger_Shadcn_>
                      <SelectContent_Shadcn_>
                        {['void', 'record', 'trigger', 'integer', ...POSTGRES_DATA_TYPES].map(
                          (option) => (
                            <SelectItem_Shadcn_ value={option} key={option}>
                              {option}
                            </SelectItem_Shadcn_>
                          )
                        )}
                      </SelectContent_Shadcn_>
                    </Select_Shadcn_>
                    <FormMessage_Shadcn_ className="col-start-5 col-span-8" />
                  </FormItem_Shadcn_>
                )}
              />
            )}
          </SidePanel.Content>
          <SidePanel.Separator />
          <SidePanel.Content>
            <FormFieldArgs readonly={isEditing} />
          </SidePanel.Content>
          <SidePanel.Separator />
          <SidePanel.Content>
            <FormField_Shadcn_
              control={form.control}
              name="definition"
              render={({ field }) => (
                <FormItem_Shadcn_ className="space-y-4">
                  <div>
                    <FormLabel_Shadcn_ className="text-base text-foreground">
                      Definition
                    </FormLabel_Shadcn_>
                    <FormDescription_Shadcn_ className="text-sm text-foreground-light">
                      <p>The language below should be written in `plpgsql`.</p>
                      {!isEditing && <p>Change the language in the Advanced Settings below.</p>}
                    </FormDescription_Shadcn_>
                  </div>

                  <div className="h-60 resize-y border border-default">
                    <FormControl_Shadcn_>
                      <SqlEditor
                        defaultValue={field.value}
                        onInputChange={(value: string | undefined) => {
                          field.onChange(value)
                        }}
                        contextmenu={false}
                      />
                    </FormControl_Shadcn_>
                  </div>

                  <FormMessage_Shadcn_ />
                </FormItem_Shadcn_>
              )}
            />
          </SidePanel.Content>
          <SidePanel.Separator />
          {isEditing ? (
            <></>
          ) : (
            <>
              <SidePanel.Content>
                <div className="space-y-8 rounded bg-studio py-4 px-6 border border-overlay">
                  <Toggle
                    onChange={() => setAdvancedSettingsShown(!advancedSettingsShown)}
                    label="Show advanced settings"
                    checked={advancedSettingsShown}
                    labelOptional="These are settings that might be familiar for postgres heavy users "
                  />
                </div>
              </SidePanel.Content>
              {advancedSettingsShown && (
                <>
                  <SidePanel.Content>
                    <div className="space-y-2">
                      <FormFieldLanguage />
                      <FormField_Shadcn_
                        control={form.control}
                        name="behavior"
                        render={({ field }) => (
                          <FormItem_Shadcn_ className="grid gap-2 md:grid md:grid-cols-12 space-y-0">
                            <FormLabel_Shadcn_ className="flex flex-col space-y-2 col-span-4 text-sm justify-center text-foreground-light">
                              Behavior
                            </FormLabel_Shadcn_>
                            {/* Form selects don't need form controls, otherwise the CSS get's weird */}
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
                            <FormMessage_Shadcn_ className="col-start-5 col-span-8" />
                          </FormItem_Shadcn_>
                        )}
                      />
                    </div>
                  </SidePanel.Content>
                  <SidePanel.Separator />
                  <SidePanel.Content>
                    <FormFieldConfigParams readonly={isEditing} />
                  </SidePanel.Content>
                  <SidePanel.Separator />
                  <SidePanel.Content>
                    <div className="space-y-4">
                      <FormField_Shadcn_
                        control={form.control}
                        name="security_definer"
                        render={({ field }) => (
                          <FormItem_Shadcn_>
                            <FormControl_Shadcn_ className="col-span-8">
                              <Radio.Group
                                type="cards"
                                label="Type of security"
                                layout="vertical"
                                onChange={(event) =>
                                  field.onChange(event.target.value == 'SECURITY_DEFINER')
                                }
                                value={field.value ? 'SECURITY_DEFINER' : 'SECURITY_INVOKER'}
                              >
                                <Radio
                                  id="SECURITY_INVOKER"
                                  label="SECURITY INVOKER"
                                  value="SECURITY_INVOKER"
                                  checked={!field.value}
                                  description="Function is to be executed with the privileges of the user that calls it."
                                />
                                <Radio
                                  id="SECURITY_DEFINER"
                                  label="SECURITY DEFINER"
                                  value="SECURITY_DEFINER"
                                  checked={field.value}
                                  description="Function is to be executed with the privileges of the user that created it."
                                />
                              </Radio.Group>
                            </FormControl_Shadcn_>
                            <FormMessage_Shadcn_ />
                          </FormItem_Shadcn_>
                        )}
                      />
                    </div>
                  </SidePanel.Content>
                </>
              )}
            </>
          )}
        </form>
      </Form_Shadcn_>
      <ConfirmationModal
        visible={isClosingPanel}
        header="Discard changes"
        buttonLabel="Discard"
        onSelectCancel={() => setIsClosingPanel(false)}
        onSelectConfirm={() => {
          setIsClosingPanel(false)
          setVisible(!visible)
        }}
      >
        <Modal.Content>
          <p className="py-4 text-sm text-foreground-light">
            There are unsaved changes. Are you sure you want to close the panel? Your changes will
            be lost.
          </p>
        </Modal.Content>
      </ConfirmationModal>
    </SidePanel>
  )
}

export default CreateFunction

interface FormFieldConfigParamsProps {
  readonly?: boolean
}

const FormFieldArgs = ({ readonly }: FormFieldConfigParamsProps) => {
  const { fields, append, remove } = useFieldArray<z.infer<typeof FormSchema>>({
    name: 'args',
  })

  return (
    <div>
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
                      <Input_Shadcn_ {...field} disabled={readonly} />
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
                              {['integer', ...POSTGRES_DATA_TYPES].map((option) => (
                                <SelectItem_Shadcn_ value={option} key={option}>
                                  {option}
                                </SelectItem_Shadcn_>
                              ))}
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
                  icon={<IconTrash size="tiny" />}
                  onClick={() => remove(index)}
                  size="small"
                  className="h-[38px]"
                />
              )}
            </div>
          )
        })}

        {!readonly && (
          <div>
            <Button
              type="default"
              icon={<IconPlus />}
              onClick={() => append({ name: '', type: 'integer' })}
              disabled={readonly}
            >
              Add a new argument
            </Button>
          </div>
        )}
      </div>
    </div>
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
    <div>
      <div className="flex flex-col">
        <h5 className="text-base text-foreground">Config params</h5>
      </div>
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
                      <Input_Shadcn_ {...field} placeholder="Name of config" />
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
                      <Input_Shadcn_ {...field} placeholder="Value of config" />
                    </FormControl_Shadcn_>
                    <FormMessage_Shadcn_ />
                  </FormItem_Shadcn_>
                )}
              />

              {!readonly && (
                <Button
                  type="danger"
                  icon={<IconTrash size="tiny" />}
                  onClick={() => remove(index)}
                  size="small"
                  className="h-[38px]"
                />
              )}
            </div>
          )
        })}

        {!readonly && (
          <Button
            type="default"
            icon={<IconPlus />}
            onClick={() => append({ name: '', type: '' })}
            disabled={readonly}
          >
            Add a new config
          </Button>
        )}
      </div>
    </div>
  )
}

const FormFieldLanguage = () => {
  const { project } = useProjectContext()

  const { data } = useDatabaseExtensionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const [enabledExtensions] = partition(data ?? [], (ext) => !isNull(ext.installed_version))

  return (
    <FormField_Shadcn_
      name="language"
      render={({ field }) => (
        <FormItem_Shadcn_ className="grid gap-2 md:grid md:grid-cols-12 space-y-0">
          <FormLabel_Shadcn_ className="flex flex-col space-y-2 col-span-4 text-sm justify-center text-foreground-light">
            Language
          </FormLabel_Shadcn_>
          {/* Form selects don't need form controls, otherwise the CSS get's weird */}
          <Select_Shadcn_ onValueChange={field.onChange} defaultValue={field.value}>
            <SelectTrigger_Shadcn_ className="col-span-8">
              <SelectValue_Shadcn_ />
            </SelectTrigger_Shadcn_>
            <SelectContent_Shadcn_>
              {enabledExtensions
                .filter((ex) => {
                  return ex.name.startsWith('pl')
                })
                .map((option) => (
                  <SelectItem_Shadcn_ value={option.name} key={option.name}>
                    {option.name}
                  </SelectItem_Shadcn_>
                ))}
            </SelectContent_Shadcn_>
          </Select_Shadcn_>
          <FormMessage_Shadcn_ className="col-start-5 col-span-8" />
        </FormItem_Shadcn_>
      )}
    />
  )
}
