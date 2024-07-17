import { useParams } from 'common'
import { DATADOG_REGIONS, LOG_DRAIN_SOURCE_VALUES, LOG_DRAIN_SOURCES } from './LogDrains.constants'

import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import {
  Button,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormMessage_Shadcn_,
  Input,
  Input_Shadcn_,
  Label_Shadcn_,
  RadioGroupStacked,
  RadioGroupStackedItem,
  Separator,
  SheetSection,
} from 'ui'
import {
  Sheet,
  SheetClose,
  SheetContent,
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
import toast from 'react-hot-toast'
import { useEffect } from 'react'

const FORM_ID = 'log-drain-destination-form'

type SourceValue = (typeof LOG_DRAIN_SOURCE_VALUES)[number]

const formUnion = z.discriminatedUnion('source', [
  z.object({ source: z.literal('webhook'), url: z.string().url() }),
  z.object({ source: z.literal('datadog'), apiKey: z.string(), region: z.string() }),
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
  const { ref } = useParams()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  })

  const source = form.watch('source', defaultSource || 'webhook')

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values)
    toast.success('Submit called')
  }

  return (
    <Sheet
      modal={true}
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          form.reset()
        }
        onOpenChange(v)
      }}
    >
      <SheetTrigger asChild>
        <Button type="primary" asChild>
          <Link href={`/project/${ref}/settings/log-drains?new=1`}>Add destination</Link>
        </Button>
      </SheetTrigger>
      <SheetContent>
        <Form_Shadcn_ {...form}>
          <form id={FORM_ID} onSubmit={form.handleSubmit(onSubmit)}>
            <SheetHeader>
              <SheetTitle>Add destination</SheetTitle>
            </SheetHeader>
            <div className="grid gap-4">
              <div className="p-4 grid gap-4">
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
                  onValueChange={(v: SourceValue) => {
                    form.setValue('source', v)
                  }}
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

              <div className="p-4 grid gap-4">
                {source === 'webhook' && (
                  <LogDrainFormItem
                    value="url"
                    label="URL"
                    formControl={form.control}
                    placeholder="https://example.com/webhooks/logs"
                  />
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

        <SheetFooter className="p-4">
          <Button form={FORM_ID} htmlType="submit" type="primary">
            Create destination
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
