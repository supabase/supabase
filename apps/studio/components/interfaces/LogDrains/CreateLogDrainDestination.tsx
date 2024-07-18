import { useParams } from 'common'
import { DATADOG_REGIONS, LOG_DRAIN_SOURCE_VALUES, LOG_DRAIN_SOURCES } from './LogDrains.constants'

import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import {
  Button,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Input_Shadcn_,
  Label_Shadcn_,
  RadioGroupStacked,
  RadioGroupStackedItem,
  Switch,
} from 'ui'
import {
  Sheet,
  SheetContent,
  SheetSection,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from 'ui'
import {
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectGroup_Shadcn_,
  SelectItem_Shadcn_,
  SelectLabel_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
} from 'ui'

import Link from 'next/link'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useCreateLogDrainMutation } from 'data/log-drains/create-log-drain-mutation'
import toast from 'react-hot-toast'

const FORM_ID = 'log-drain-destination-form'

type SourceValue = (typeof LOG_DRAIN_SOURCE_VALUES)[number]

const formUnion = z.discriminatedUnion('source', [
  z.object({
    source: z.literal('webhook'),
    url: z.string().url(),
    httpVersion: z.enum(['HTTP1', 'HTTP2']),
    gzip: z.boolean(),
  }),
  z.object({
    source: z.literal('datadog'),
    apiKey: z.string(),
    region: z.string(),
  }),
  z.object({
    source: z.literal('elasticfilebeat'),
    url: z.string().url(),
    username: z.string(),
    password: z.string(),
  }),
])

const formSchema = z
  .object({
    name: z.string().min(1, {
      message: 'Destination name is required',
    }),
    description: z.string().optional(),
  })
  .and(formUnion)

function LogDrainFormItem({
  value,
  label,
  description,
  formControl,
  placeholder,
  type,
}: {
  value: string
  label: string
  formControl: any
  placeholder?: string
  description?: string
  type?: string
}) {
  return (
    <FormField_Shadcn_
      name={value}
      control={formControl}
      render={({ field }) => (
        <FormItemLayout layout="horizontal" label={label} description={description}>
          <FormControl_Shadcn_>
            <Input_Shadcn_ type={type || 'text'} placeholder={placeholder} {...field} />
          </FormControl_Shadcn_>
        </FormItemLayout>
      )}
    />
  )
}

export function CreateLogDrainDestination({
  open,
  onOpenChange,
  defaultSource,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  defaultSource?: 'webhook' | 'datadog' | 'elasticfilebeat'
}) {
  const { ref } = useParams() as { ref: string }

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  })

  const source = form.watch('source', defaultSource || 'webhook')

  const { mutate: createLogDrain } = useCreateLogDrainMutation({
    onSuccess: () => {
      toast.success('Log drain destination created')
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    onOpenChange(false)
    createLogDrain({
      ...values,
      projectRef: ref,
      config: {},
    })
    form.reset()
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          form.reset()
        }
        onOpenChange(v)
      }}
    >
      <SheetContent showClose={false} size="lg">
        <SheetHeader>
          <SheetTitle>Add destination</SheetTitle>
        </SheetHeader>
        <SheetSection>
          <Form_Shadcn_ {...form}>
            <form id={FORM_ID} onSubmit={form.handleSubmit(onSubmit)}>
              <div className="">
                <div className="space-y-4">
                  <LogDrainFormItem
                    value="name"
                    placeholder="My Destination"
                    label="Name"
                    formControl={form.control}
                  />
                  <LogDrainFormItem
                    value="description"
                    label="Description"
                    placeholder="Description of the destination"
                    formControl={form.control}
                  />
                  <RadioGroupStacked
                    value={source}
                    onValueChange={(v: SourceValue) => form.setValue('source', v)}
                  >
                    {LOG_DRAIN_SOURCES.map((source) => (
                      <RadioGroupStackedItem
                        value={source.value}
                        key={source.value}
                        id={source.value}
                        label={source.name}
                        description={source.description}
                        className="text-left"
                      />
                    ))}
                  </RadioGroupStacked>
                </div>

                <div className="space-y-4 mt-6">
                  {source === 'webhook' && (
                    <>
                      <LogDrainFormItem
                        value="url"
                        label="URL"
                        formControl={form.control}
                        placeholder="https://example.com/webhooks/logs"
                      />
                      <RadioGroupStacked>
                        <RadioGroupStackedItem value="HTTP1" label="HTTP1" />
                        <RadioGroupStackedItem value="HTTP2" label="HTTP2" />
                      </RadioGroupStacked>
                      <div className="flex items-center space-x-2">
                        <Switch id="gzip" />
                        <Label_Shadcn_ htmlFor="gzip">Gzip</Label_Shadcn_>
                      </div>
                    </>
                  )}
                  {source === 'datadog' && (
                    <div className="grid gap-4">
                      <LogDrainFormItem
                        value="apiKey"
                        label="API Key"
                        formControl={form.control}
                        description="The API Key obtained from the Datadog dashboard."
                      />
                      <FormField_Shadcn_
                        name="region"
                        control={form.control}
                        render={({ field }) => (
                          <FormItemLayout layout="horizontal" label={'Region'}>
                            <FormControl_Shadcn_>
                              <Select_Shadcn_
                                {...field}
                                onValueChange={(v) => {
                                  form.setValue('region', v)
                                }}
                              >
                                <SelectTrigger_Shadcn_ className="col-span-3">
                                  <SelectValue_Shadcn_ placeholder="Select a region" />
                                </SelectTrigger_Shadcn_>
                                <SelectContent_Shadcn_>
                                  <SelectGroup_Shadcn_>
                                    <SelectLabel_Shadcn_>Region</SelectLabel_Shadcn_>
                                    {DATADOG_REGIONS.map((reg) => (
                                      <SelectItem_Shadcn_ key={reg.value} value={reg.value}>
                                        {reg.label}
                                      </SelectItem_Shadcn_>
                                    ))}
                                  </SelectGroup_Shadcn_>
                                </SelectContent_Shadcn_>
                              </Select_Shadcn_>
                            </FormControl_Shadcn_>
                          </FormItemLayout>
                        )}
                      />
                    </div>
                  )}
                  {source === 'elasticfilebeat' && (
                    <div className="grid gap-4">
                      <LogDrainFormItem
                        value="url"
                        label="URL"
                        formControl={form.control}
                        placeholder="https://example.com/webhooks/logs"
                      />
                      <LogDrainFormItem
                        value="username"
                        label="Username"
                        formControl={form.control}
                      />
                      <LogDrainFormItem
                        type="password"
                        value="password"
                        label="Password"
                        formControl={form.control}
                      />
                    </div>
                  )}
                </div>
              </div>
            </form>
          </Form_Shadcn_>
        </SheetSection>

        <SheetFooter className="p-4">
          <Button form={FORM_ID} htmlType="submit" type="primary">
            Create destination
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
