import { zodResolver } from '@hookform/resolvers/zod'
import { Box, FileWarning } from 'lucide-react'
import { useForm } from 'react-hook-form'
import {
  Badge,
  Button,
  Checkbox_Shadcn_,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  RadioGroup_Shadcn_,
  RadioGroupItem_Shadcn_,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Separator,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetSection,
  SheetTitle,
  Switch,
} from 'ui'
import { z } from 'zod'

import { Input } from '../DataInputs/Input'
import { InfoTooltip } from '../info-tooltip'
import { FormItemLayout } from './FormItemLayout/FormItemLayout'

const items = [
  {
    id: 'recents',
    label: 'Recents',
  },
  {
    id: 'home',
    label: 'Home',
  },
  {
    id: 'applications',
    label: 'Applications',
  },
  {
    id: 'desktop',
    label: 'Desktop',
  },
  {
    id: 'downloads',
    label: 'Downloads',
  },
  {
    id: 'documents',
    label: 'Documents',
  },
] as const

export const Page = () => {
  const FormSchema = z.object({
    username: z.string().min(2, {
      message: 'Username must be at least 2 characters.',
    }),
    kevins_input: z.string().min(6, {
      message: 'Username must be at least 6 characters.',
    }),
    email: z
      .string({
        required_error: 'Please select an email to display.',
      })
      .email(),
    consistent_settings: z.boolean().default(false).optional(),
    switch_option: z.boolean().default(false).optional(),
    items: z.array(z.string()).refine((value) => value.some((item) => item), {
      message: 'You have to select at least one item.',
    }),
    type: z.enum(['all', 'mentions', 'none'], {
      required_error: 'You need to select a notification type.',
    }),
  })

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      username: '',
      items: ['recents', 'home'],
    },
  })

  function onSubmit(data: z.infer<typeof FormSchema>) {
    console.log(data)
  }

  const UserIcon = () => {
    return (
      <div>
        <img
          className="relative h-4 w-4 rounded-full"
          src="https://avatars.githubusercontent.com/u/8291514?v=4"
        />
      </div>
    )
  }

  return (
    <Sheet open={true}>
      <SheetContent side="right" className="overflow-auto" size="default">
        <SheetHeader>
          <SheetTitle>Create a function</SheetTitle>
          <SheetDescription>Create a function</SheetDescription>
        </SheetHeader>
        <Form_Shadcn_ {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <SheetSection>
              <FormField_Shadcn_
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItemLayout
                    label="Function name"
                    description="Name will also be used for the function name in postgres."
                    layout="horizontal"
                    labelOptional="Optional"
                    afterLabel={
                      <InfoTooltip side="right">You can also rename this later.</InfoTooltip>
                    }
                  >
                    <FormControl_Shadcn_>
                      <Input placeholder="Name of function" {...field} />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
            </SheetSection>
            <Separator />

            {/* <FormField
              control={form.control}
              name="language"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Language</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            'w-[200px] justify-between',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value
                            ? languages.find((language) => language.value === field.value)?.label
                            : 'Select language'}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0">
                      <Command>
                        <CommandInput placeholder="Search language..." />
                        <CommandEmpty>No language found.</CommandEmpty>
                        <CommandGroup>
                          {languages.map((language) => (
                            <CommandItem
                              value={language.label}
                              key={language.value}
                              onSelect={() => {
                                form.setValue('language', language.value)
                              }}
                            >
                              <Check
                                className={cn(
                                  'mr-2 h-4 w-4',
                                  language.value === field.value ? 'opacity-100' : 'opacity-0'
                                )}
                              />
                              {language.label}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    This is the language that will be used in the dashboard.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            /> */}
            <SheetSection>
              <FormField_Shadcn_
                control={form.control}
                name="switch_option"
                render={({ field }) => (
                  <FormItemLayout
                    afterLabel="Switch"
                    label="Use ./supabase directory for everything"
                    description="This is an explanation."
                    layout="flex"
                  >
                    <FormControl_Shadcn_>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
            </SheetSection>
            <Separator />
            <SheetSection>
              <FormField_Shadcn_
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItemLayout
                    label="Choose user"
                    description="This is your public display name."
                    layout="horizontal"
                  >
                    <Select_Shadcn_ onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl_Shadcn_ className="w-full">
                        <SelectTrigger_Shadcn_ className="w-full">
                          <SelectValue_Shadcn_
                            placeholder="Select a verified email"
                            className="flex gap-2"
                          />
                        </SelectTrigger_Shadcn_>
                      </FormControl_Shadcn_>
                      <SelectContent_Shadcn_>
                        <SelectItem_Shadcn_ value="m@example.com">
                          <div className="flex gap-2 items-center">
                            <UserIcon />
                            <span>m@example.com</span>
                          </div>
                        </SelectItem_Shadcn_>
                        <SelectItem_Shadcn_ value="m@google.com" className="flex gap-2">
                          <div className="flex gap-2 items-center">
                            <UserIcon />
                            UserIconm@google.com
                          </div>
                        </SelectItem_Shadcn_>
                        <SelectItem_Shadcn_ value="m@support.com" className="flex gap-2">
                          <div className="flex gap-2 items-center">
                            <UserIcon />
                            m@support.com
                          </div>
                        </SelectItem_Shadcn_>
                      </SelectContent_Shadcn_>
                    </Select_Shadcn_>
                  </FormItemLayout>
                )}
              />
            </SheetSection>

            <Separator />

            <SheetSection>
              <FormField_Shadcn_
                control={form.control}
                name="kevins_input"
                render={({ field }) => (
                  <FormItemLayout
                    afterLabel="Kevins input"
                    label="Kevins input"
                    description="This is your public display name."
                    layout="vertical"
                    labelOptional="Optional"
                  >
                    <FormControl_Shadcn_>
                      <Input
                        icon={<Box strokeWidth={1.5} size={16} />}
                        placeholder="Needs to be 6 long"
                        {...field}
                      />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
            </SheetSection>

            <Separator />

            <SheetSection>
              <FormField_Shadcn_
                control={form.control}
                name="consistent_settings"
                render={({ field }) => (
                  <FormItemLayout
                    afterLabel={
                      <Badge variant="destructive" className="flex gap-1">
                        <FileWarning size={12} strokeWidth={1.5} className="text-destructive-500" />
                        Danger
                      </Badge>
                    }
                    label="Use consistent settings"
                    description="This is your public display name."
                    layout="flex"
                  >
                    <FormControl_Shadcn_>
                      <Checkbox_Shadcn_ checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
            </SheetSection>

            <Separator />

            <SheetSection>
              <FormField_Shadcn_
                control={form.control}
                name="items"
                render={() => (
                  <FormItemLayout
                    label="Sidebar"
                    description="Select the items you want to display in the sidebar."
                    layout="horizontal"
                    afterLabel={<InfoTooltip side="right">Please give me info</InfoTooltip>}
                  >
                    {/* <div className="mb-4">
                <FormLabel className="text-base">Sidebar</FormLabel>
                <FormDescription>
                  Select the items you want to display in the sidebar.
                </FormDescription>
              </div> */}
                    {items.map((item) => (
                      <FormField_Shadcn_
                        key={item.id}
                        control={form.control}
                        name="items"
                        render={({ field }) => {
                          return (
                            <FormItemLayout
                              key={item.id}
                              className="flex flex-row items-start space-x-3 space-y-0"
                              label={item.label}
                              layout="flex"
                              hideMessage
                            >
                              <FormControl_Shadcn_>
                                <Checkbox_Shadcn_
                                  checked={field.value?.includes(item.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, item.id])
                                      : field.onChange(
                                          field.value?.filter((value) => value !== item.id)
                                        )
                                  }}
                                />
                              </FormControl_Shadcn_>
                            </FormItemLayout>
                          )
                        }}
                      />
                    ))}
                    {/* <FormMessage /> */}
                  </FormItemLayout>
                )}
              />
            </SheetSection>

            <SheetSection>
              <FormField_Shadcn_
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItemLayout
                    className="space-y-3"
                    label="Notify me about..."
                    description="I am descript"
                    layout="horizontal"
                  >
                    <FormControl_Shadcn_>
                      <RadioGroup_Shadcn_
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <FormItemLayout
                          className="flex items-center space-x-3 space-y-0"
                          label="All new messages"
                          layout="flex"
                          hideMessage
                        >
                          <FormControl_Shadcn_>
                            <RadioGroupItem_Shadcn_ value="all" />
                          </FormControl_Shadcn_>
                        </FormItemLayout>
                        <FormItemLayout
                          className="flex items-center space-x-3 space-y-0"
                          label="Direct messages and mentions"
                          layout="flex"
                          hideMessage
                        >
                          <FormControl_Shadcn_>
                            <RadioGroupItem_Shadcn_ value="mentions" />
                          </FormControl_Shadcn_>
                        </FormItemLayout>
                        <FormItemLayout
                          className="flex items-center space-x-3 space-y-0"
                          label="Nothing"
                          layout="flex"
                          hideMessage
                        >
                          <FormControl_Shadcn_>
                            <RadioGroupItem_Shadcn_ value="none" />
                          </FormControl_Shadcn_>
                        </FormItemLayout>
                      </RadioGroup_Shadcn_>
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
            </SheetSection>
            <SheetFooter>
              <Button type="default">Cancel</Button>
              <Button htmlType="submit">Submit</Button>
            </SheetFooter>
          </form>
        </Form_Shadcn_>
      </SheetContent>
    </Sheet>
  )
}
