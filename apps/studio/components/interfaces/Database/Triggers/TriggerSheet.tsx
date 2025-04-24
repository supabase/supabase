import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Plus, Terminal } from 'lucide-react'
import { useEffect, useState } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'

import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import FormBoxEmpty from 'components/ui/FormBoxEmpty'
import { useDatabaseTriggerCreateMutation } from 'data/database-triggers/database-trigger-create-mutation'
import { useTablesQuery } from 'data/tables/tables-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { PROTECTED_SCHEMAS } from 'lib/constants/schemas'
import {
  Button,
  Checkbox_Shadcn_,
  cn,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Input_Shadcn_,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Separator,
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import ChooseFunctionForm from './ChooseFunctionForm'
import { TRIGGER_EVENTS, TRIGGER_ORIENTATIONS, TRIGGER_TYPES } from './Triggers.constants'

const formId = 'create-trigger'

const FormSchema = z.object({
  name: z
    .string()
    .min(1, 'Please provide a name for your trigger')
    .regex(/^\S+$/, 'Name should not contain spaces or whitespaces'),
  schema: z.string(),
  table: z.string(),
  activation: z.string(),
  enabled_mode: z.string(),
  orientation: z.string(),
  function_name: z.string(),
  function_schema: z.string(),
  events: z.array(z.string()).min(1, 'Please select at least one event'),
  // For UI handling, not to be passed to the final request
  tableId: z.string(),
})

const defaultValues = {
  name: '',
  schema: '',
  table: '',
  activation: 'BEFORE',
  orientation: 'STATEMENT',
  function_name: '',
  function_schema: '',
  enabled_mode: 'ORIGIN',
  events: [],
}

export const TriggerSheet = () => {
  const project = useSelectedProject()
  const canCreateTriggers = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'triggers')

  const [open, setOpen] = useState(false)
  const [showFunctionSelector, setShowFunctionSelector] = useState(false)

  const { mutate: createDatabaseTrigger, isLoading: isCreating } =
    useDatabaseTriggerCreateMutation()

  const { data = [], isSuccess } = useTablesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const tables = data
    .sort((a, b) => a.schema.localeCompare(b.schema))
    .filter((a) => !PROTECTED_SCHEMAS.includes(a.schema))

  const form = useForm<z.infer<typeof FormSchema>>({
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    resolver: zodResolver(FormSchema),
    defaultValues,
  })
  const { function_name, function_schema } = form.watch()

  const onSubmit: SubmitHandler<z.infer<typeof FormSchema>> = async (values) => {
    if (!project) return console.error('Project is required')
    const { tableId, ...payload } = values

    createDatabaseTrigger(
      {
        projectRef: project?.ref,
        connectionString: project?.connectionString,
        payload,
      },
      {
        onSuccess: () => {
          toast.success(`Successfully created trigger ${payload.name}`)
          setOpen(false)
        },
        onError: (error) => {
          toast.error(`Failed to create trigger: ${error.message}`)
        },
      }
    )
  }

  useEffect(() => {
    if (open && isSuccess) {
      form.clearErrors()
      form.reset({
        ...defaultValues,
        tableId: tables[0].id.toString(),
        table: tables[0].name,
        schema: tables[0].schema,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isSuccess])

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <ButtonTooltip
            type="primary"
            icon={<Plus />}
            disabled={!canCreateTriggers}
            tooltip={{
              content: {
                side: 'bottom',
                text: !canCreateTriggers
                  ? 'You need additional permissions to create triggers'
                  : undefined,
              },
            }}
          >
            New trigger
          </ButtonTooltip>
        </SheetTrigger>
        <SheetContent size="lg" className="flex flex-col gap-0">
          <SheetHeader>
            <SheetTitle>Create a new database trigger</SheetTitle>
          </SheetHeader>

          <Form_Shadcn_ {...form}>
            <form
              id={formId}
              className="flex-1 flex flex-col gap-y-6 overflow-auto py-6"
              onSubmit={form.handleSubmit(onSubmit)}
            >
              <FormField_Shadcn_
                name="name"
                control={form.control}
                render={({ field }) => (
                  <FormItemLayout
                    className="px-5"
                    layout="horizontal"
                    label="Name of trigger"
                    description="Do not use spaces/whitespace."
                  >
                    <FormControl_Shadcn_>
                      <Input_Shadcn_ {...field} />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />

              <Separator />

              <FormField_Shadcn_
                name="tableId"
                control={form.control}
                render={({ field }) => (
                  <FormItemLayout
                    className="px-5"
                    layout="horizontal"
                    label="Table"
                    description="Trigger will watch for changes on this table"
                  >
                    <FormControl_Shadcn_>
                      <Select_Shadcn_
                        defaultValue={field.value}
                        onValueChange={(val) => {
                          const table = tables.find((x) => x.id.toString() === val)
                          if (table) {
                            form.setValue('table', table.name)
                            form.setValue('schema', table.schema)
                          }
                        }}
                      >
                        <SelectTrigger_Shadcn_ className="col-span-8">
                          <SelectValue_Shadcn_ />
                        </SelectTrigger_Shadcn_>
                        <SelectContent_Shadcn_>
                          {tables.map((table) => (
                            <SelectItem_Shadcn_ key={table.id} value={table.id.toString()}>
                              <span className="text-foreground-light">{table.schema}.</span>
                              <span className="text-foreground">{table.name}</span>
                            </SelectItem_Shadcn_>
                          ))}
                        </SelectContent_Shadcn_>
                      </Select_Shadcn_>
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />

              <FormField_Shadcn_
                name="events"
                control={form.control}
                render={() => (
                  <FormItemLayout
                    className="px-5"
                    layout="horizontal"
                    label="Events"
                    description="These are the events that are watched by the trigger, only the events selected above will fire the trigger on the table you've selected."
                  >
                    {TRIGGER_EVENTS.map((event) => (
                      <FormField_Shadcn_
                        key={event.value}
                        control={form.control}
                        name="events"
                        render={({ field }) => (
                          <FormItemLayout
                            hideMessage
                            layout="flex"
                            label={event.label}
                            description={event.description}
                          >
                            <FormControl_Shadcn_>
                              <Checkbox_Shadcn_
                                className="translate-y-[2px]"
                                checked={field.value?.includes(event.value)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...field.value, event.value])
                                    : field.onChange(
                                        field.value?.filter((value) => value !== event.value)
                                      )
                                }}
                              />
                            </FormControl_Shadcn_>
                          </FormItemLayout>
                        )}
                      />
                    ))}
                  </FormItemLayout>
                )}
              />

              <FormField_Shadcn_
                name="activation"
                control={form.control}
                render={({ field }) => (
                  <FormItemLayout
                    className="px-5"
                    layout="horizontal"
                    label="Trigger type"
                    description="Determines when your trigger fires"
                  >
                    <FormControl_Shadcn_>
                      <Select_Shadcn_ defaultValue={field.value} onValueChange={field.onChange}>
                        <SelectTrigger_Shadcn_ className="col-span-8">
                          {field.value === 'BEFORE' ? 'Before the event' : 'After the event'}
                        </SelectTrigger_Shadcn_>
                        <SelectContent_Shadcn_>
                          {TRIGGER_TYPES.map((option) => (
                            <SelectItem_Shadcn_ key={option.value} value={option.value}>
                              <p className="text-foreground">{option.label}</p>
                              <p className="text-foreground-lighter">{option.description}</p>
                            </SelectItem_Shadcn_>
                          ))}
                        </SelectContent_Shadcn_>
                      </Select_Shadcn_>
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />

              <FormField_Shadcn_
                name="orientation"
                control={form.control}
                render={({ field }) => (
                  <FormItemLayout
                    className="px-5"
                    layout="horizontal"
                    label="Orientation"
                    description="Identifies whether the trigger fires once for each processed row or once for each statement"
                  >
                    <FormControl_Shadcn_>
                      <Select_Shadcn_ defaultValue={field.value} onValueChange={field.onChange}>
                        <SelectTrigger_Shadcn_ className="col-span-8">
                          {field.value === 'STATEMENT' ? 'Statement' : 'Row'}
                        </SelectTrigger_Shadcn_>
                        <SelectContent_Shadcn_>
                          {TRIGGER_ORIENTATIONS.map((option) => (
                            <SelectItem_Shadcn_ key={option.value} value={option.value}>
                              <p className="text-foreground">{option.label}</p>
                              <p className="text-foreground-lighter">{option.description}</p>
                            </SelectItem_Shadcn_>
                          ))}
                        </SelectContent_Shadcn_>
                      </Select_Shadcn_>
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />

              <Separator />

              <div className="px-5 flex flex-col gap-y-2">
                <p className="text-smn">Function to trigger</p>
                {function_name.length === 0 ? (
                  <button
                    type="button"
                    className={cn(
                      'relative w-full rounded border border-default',
                      'bg-surface-200 px-5 py-1 shadow-sm transition-all',
                      'hover:border-strong hover:bg-overlay-hover'
                    )}
                    onClick={() => setShowFunctionSelector(true)}
                  >
                    <FormBoxEmpty
                      icon={<Terminal size={14} strokeWidth={2} />}
                      text="Choose a function to trigger"
                    />
                  </button>
                ) : (
                  <div
                    className={cn(
                      'relative w-full flex items-center justify-between',
                      'space-x-3 px-5 py-4 border border-default',
                      'rounded shadow-sm transition-shadow'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded bg-foreground text-background focus-within:bg-opacity-10">
                        <Terminal size="18" strokeWidth={2} width={14} />
                      </div>
                      <p>
                        <span className="text-sm text-foreground-light">{function_schema}</span>.
                        <span className="text-sm text-foreground">{function_name}</span>
                      </p>
                    </div>
                    <Button type="default" onClick={() => setShowFunctionSelector(true)}>
                      Change function
                    </Button>
                  </div>
                )}
              </div>
            </form>
          </Form_Shadcn_>

          <SheetFooter className="shrink-0">
            <Button
              type="default"
              htmlType="reset"
              disabled={isCreating}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button form={formId} htmlType="submit" loading={isCreating}>
              Create trigger
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <ChooseFunctionForm
        visible={showFunctionSelector}
        setVisible={setShowFunctionSelector}
        onChange={(fn) => {
          form.setValue('function_name', fn.name)
          form.setValue('function_schema', fn.schema)
        }}
      />
    </>
  )
}
