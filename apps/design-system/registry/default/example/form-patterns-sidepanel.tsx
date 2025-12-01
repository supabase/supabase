import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { CalendarIcon, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import * as z from 'zod'

import {
  Button,
  Calendar,
  Checkbox_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Form_Shadcn_,
  Input_Shadcn_,
  Popover_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  RadioGroupStacked,
  RadioGroupStackedItem,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetSection,
  SheetTitle,
  Switch,
  Textarea,
  PrePostTab,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import {
  MultiSelector,
  MultiSelectorContent,
  MultiSelectorItem,
  MultiSelectorList,
  MultiSelectorTrigger,
} from 'ui-patterns/multi-select'

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  maxConnections: z.number().min(1).max(1000),
  enableFeature: z.boolean(),
  enableRls: z.boolean(),
  enableNotifications: z.boolean(),
  enableAnalytics: z.boolean(),
  region: z.string().min(1, 'Region is required'),
  schemas: z.array(z.string()).min(1, 'At least one schema is required'),
  queueType: z.enum(['basic', 'partitioned']),
  expiryDate: z.date().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  duration: z.number().min(5).max(30),
  redirectUris: z.array(z.object({ value: z.string().url('Must be a valid URL') })),
})

export default function FormPatternsSidePanel() {
  const [open, setOpen] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      maxConnections: 10,
      enableFeature: false,
      enableRls: true,
      enableNotifications: false,
      enableAnalytics: true,
      region: '',
      schemas: [],
      queueType: 'basic',
      expiryDate: undefined,
      password: '',
      duration: 10,
      redirectUris: [{ value: '' }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'redirectUris',
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values)
    setOpen(false)
  }

  const formId = 'sidepanel-form'

  return (
    <>
      <Button type="primary" onClick={() => setOpen(true)}>
        Open form panel
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent size="lg" className="flex flex-col gap-0">
          <SheetHeader>
            <SheetTitle>Create Configuration</SheetTitle>
          </SheetHeader>
          <Form_Shadcn_ {...form}>
            <form
              id={formId}
              onSubmit={form.handleSubmit(onSubmit)}
              className="overflow-auto flex-grow px-0"
            >
              {/* Text Input */}
              <SheetSection>
                <FormField_Shadcn_
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItemLayout
                      layout="horizontal"
                      label="Text Input"
                      description="Single-line text entry for short values"
                    >
                      <FormControl_Shadcn_ className="col-span-6">
                        <Input_Shadcn_ {...field} placeholder="Enter text" />
                      </FormControl_Shadcn_>
                    </FormItemLayout>
                  )}
                />
              </SheetSection>

              {/* Password Input */}
              <SheetSection>
                <FormField_Shadcn_
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItemLayout
                      layout="horizontal"
                      label="Password Input"
                      description="Masked input for secure text entry"
                    >
                      <FormControl_Shadcn_ className="col-span-6">
                        <Input_Shadcn_ {...field} type="password" placeholder="Enter password" />
                      </FormControl_Shadcn_>
                    </FormItemLayout>
                  )}
                />
              </SheetSection>

              {/* Input with Units */}
              <SheetSection>
                <FormField_Shadcn_
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItemLayout
                      layout="horizontal"
                      label="Input with Units"
                      description="Input with additional unit label"
                    >
                      <FormControl_Shadcn_ className="col-span-6">
                        <PrePostTab postTab="MB" className="w-full">
                          <Input_Shadcn_ {...field} type="number" min={5} max={30} />
                        </PrePostTab>
                      </FormControl_Shadcn_>
                    </FormItemLayout>
                  )}
                />
              </SheetSection>

              {/* Textarea */}
              <SheetSection>
                <FormField_Shadcn_
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItemLayout
                      layout="horizontal"
                      label="Textarea"
                      description="Multi-line text input for longer content"
                    >
                      <FormControl_Shadcn_ className="col-span-6">
                        <Textarea
                          {...field}
                          rows={3}
                          placeholder="Enter multi-line text"
                          className="resize-none"
                        />
                      </FormControl_Shadcn_>
                    </FormItemLayout>
                  )}
                />
              </SheetSection>

              {/* Number Input */}
              <SheetSection>
                <FormField_Shadcn_
                  control={form.control}
                  name="maxConnections"
                  render={({ field }) => (
                    <FormItemLayout
                      layout="horizontal"
                      label="Number Input"
                      description="Numeric input with min/max validation"
                    >
                      <FormControl_Shadcn_ className="col-span-6">
                        <Input_Shadcn_
                          {...field}
                          type="number"
                          min={1}
                          max={1000}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl_Shadcn_>
                    </FormItemLayout>
                  )}
                />
              </SheetSection>

              {/* Switch */}
              <SheetSection>
                <FormField_Shadcn_
                  control={form.control}
                  name="enableFeature"
                  render={({ field }) => (
                    <FormItemLayout
                      layout="horizontal"
                      label="Switch"
                      description="Toggle for boolean on/off states"
                    >
                      <FormControl_Shadcn_ className="col-span-6">
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl_Shadcn_>
                    </FormItemLayout>
                  )}
                />
              </SheetSection>

              {/* Checkbox */}
              <SheetSection>
                <FormItemLayout
                  layout="horizontal"
                  label="Checkbox"
                  description="Boolean values or multiple selections"
                >
                  <div className="col-span-6 w-full flex flex-col gap-4">
                    <FormField_Shadcn_
                      control={form.control}
                      name="enableRls"
                      render={({ field }) => (
                        <div className="flex items-center w-full justify-start space-x-2">
                          <FormControl_Shadcn_>
                            <Checkbox_Shadcn_
                              id="enable-rls"
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl_Shadcn_>
                          <label
                            htmlFor="enable-rls"
                            className="text-sm text-foreground-light leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            Enable Row Level Security
                          </label>
                        </div>
                      )}
                    />
                    <FormField_Shadcn_
                      control={form.control}
                      name="enableNotifications"
                      render={({ field }) => (
                        <div className="flex items-center w-full justify-start space-x-2">
                          <FormControl_Shadcn_>
                            <Checkbox_Shadcn_
                              id="enable-notifications"
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl_Shadcn_>
                          <label
                            htmlFor="enable-notifications"
                            className="text-sm text-foreground-light leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            Enable email notifications
                          </label>
                        </div>
                      )}
                    />
                    <FormField_Shadcn_
                      control={form.control}
                      name="enableAnalytics"
                      render={({ field }) => (
                        <div className="flex items-center w-full justify-start space-x-2">
                          <FormControl_Shadcn_>
                            <Checkbox_Shadcn_
                              id="enable-analytics"
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl_Shadcn_>
                          <label
                            htmlFor="enable-analytics"
                            className="text-sm text-foreground-light leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            Enable analytics tracking
                          </label>
                        </div>
                      )}
                    />
                  </div>
                </FormItemLayout>
              </SheetSection>

              {/* Select */}
              <SheetSection>
                <FormField_Shadcn_
                  control={form.control}
                  name="region"
                  render={({ field }) => (
                    <FormItemLayout
                      layout="horizontal"
                      label="Select (Dropdown)"
                      description="Single selection from a list of options"
                    >
                      <FormControl_Shadcn_ className="col-span-6">
                        <Select_Shadcn_ value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger_Shadcn_>
                            <SelectValue_Shadcn_ placeholder="Select an option" />
                          </SelectTrigger_Shadcn_>
                          <SelectContent_Shadcn_>
                            <SelectItem_Shadcn_ value="us-east-1">
                              US East (N. Virginia)
                            </SelectItem_Shadcn_>
                            <SelectItem_Shadcn_ value="us-west-2">
                              US West (Oregon)
                            </SelectItem_Shadcn_>
                            <SelectItem_Shadcn_ value="eu-west-1">
                              EU West (Ireland)
                            </SelectItem_Shadcn_>
                          </SelectContent_Shadcn_>
                        </Select_Shadcn_>
                      </FormControl_Shadcn_>
                    </FormItemLayout>
                  )}
                />
              </SheetSection>

              {/* Multi-Select */}
              <SheetSection>
                <FormField_Shadcn_
                  control={form.control}
                  name="schemas"
                  render={({ field }) => (
                    <FormItemLayout
                      layout="horizontal"
                      label="Multi-Select"
                      description="Multiple selection from a list"
                    >
                      <div className="col-span-6">
                        <MultiSelector
                          onValuesChange={field.onChange}
                          values={field.value}
                          size="small"
                          className="w-full"
                        >
                          <MultiSelectorTrigger
                            mode="inline-combobox"
                            label="Select options..."
                            badgeLimit="wrap"
                            showIcon={false}
                            deletableBadge
                            className="w-full !min-w-lg"
                          />
                          <MultiSelectorContent>
                            <MultiSelectorList>
                              <MultiSelectorItem value="public">public</MultiSelectorItem>
                              <MultiSelectorItem value="auth">auth</MultiSelectorItem>
                              <MultiSelectorItem value="storage">storage</MultiSelectorItem>
                            </MultiSelectorList>
                          </MultiSelectorContent>
                        </MultiSelector>
                      </div>
                    </FormItemLayout>
                  )}
                />
              </SheetSection>

              {/* Radio Group */}
              <SheetSection>
                <FormField_Shadcn_
                  control={form.control}
                  name="queueType"
                  render={({ field }) => (
                    <FormItemLayout
                      layout="horizontal"
                      label="Radio Group"
                      description="Single selection from multiple options"
                    >
                      <div className="col-span-6">
                        <RadioGroupStacked value={field.value} onValueChange={field.onChange}>
                          <RadioGroupStackedItem
                            value="basic"
                            label="Option 1"
                            description="First option description"
                          />
                          <RadioGroupStackedItem
                            value="partitioned"
                            label="Option 2"
                            description="Second option description"
                          />
                        </RadioGroupStacked>
                      </div>
                    </FormItemLayout>
                  )}
                />
              </SheetSection>

              {/* Date Picker */}
              <SheetSection>
                <FormField_Shadcn_
                  control={form.control}
                  name="expiryDate"
                  render={({ field }) => (
                    <FormItemLayout
                      layout="horizontal"
                      label="Date Picker"
                      description="Date selection with calendar popover"
                    >
                      <FormControl_Shadcn_ className="col-span-6">
                        <Popover_Shadcn_>
                          <PopoverTrigger_Shadcn_ asChild>
                            <Button
                              type="outline"
                              className="w-full justify-start text-left font-normal px-3 py-4"
                              icon={<CalendarIcon className="h-4 w-4" />}
                            >
                              {field.value ? format(field.value, 'PPP') : 'Pick a date'}
                            </Button>
                          </PopoverTrigger_Shadcn_>
                          <PopoverContent_Shadcn_ className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent_Shadcn_>
                        </Popover_Shadcn_>
                      </FormControl_Shadcn_>
                    </FormItemLayout>
                  )}
                />
              </SheetSection>

              {/* Field Array */}
              <SheetSection>
                <FormField_Shadcn_
                  control={form.control}
                  name="redirectUris"
                  render={() => (
                    <FormItemLayout
                      layout="horizontal"
                      label="Field Array"
                      description="Dynamic list for adding/removing items"
                    >
                      <div className="col-span-6 space-y-2">
                        {fields.map((field, index) => (
                          <FormField_Shadcn_
                            key={field.id}
                            control={form.control}
                            name={`redirectUris.${index}.value`}
                            render={({ field: inputField }) => (
                              <div className="flex gap-2">
                                <FormControl_Shadcn_>
                                  <Input_Shadcn_
                                    {...inputField}
                                    placeholder="https://example.com/callback"
                                  />
                                </FormControl_Shadcn_>
                                {fields.length > 1 && (
                                  <Button
                                    type="default"
                                    size="tiny"
                                    icon={<Trash2 size={12} />}
                                    onClick={() => remove(index)}
                                  />
                                )}
                              </div>
                            )}
                          />
                        ))}
                        <Button
                          type="default"
                          icon={<Plus />}
                          onClick={() => append({ value: '' })}
                        >
                          Add redirect URI
                        </Button>
                      </div>
                    </FormItemLayout>
                  )}
                />
              </SheetSection>
            </form>
          </Form_Shadcn_>
          <SheetFooter>
            <Button
              type="default"
              onClick={() => {
                form.reset()
                setOpen(false)
              }}
            >
              Cancel
            </Button>
            <Button type="primary" form={formId} htmlType="submit">
              Create
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  )
}
