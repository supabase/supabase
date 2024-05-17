import { zodResolver } from '@hookform/resolvers/zod'
import type { Meta } from '@storybook/react'
import {
  ArrowUpCircle,
  Calendar,
  Check,
  CheckCircle2,
  ChevronsUpDown,
  Circle,
  HelpCircle,
  LucideIcon,
  MoreHorizontal,
  Tags,
  Trash,
  User,
  XCircle,
} from 'lucide-react'
import React from 'react'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { cn } from '../../../lib/utils/cn'
import { Button } from '../ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '../ui/command'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { toast } from '../ui/use-toast'

const meta: Meta<typeof DropdownMenu> = {
  /* 👇 The title prop is optional.
   * See https://storybook.js.org/docs/react/configure/overview#configure-story-loading
   * to learn how to generate automatic titles
   */
  title: 'shadcn/Combobox',
  component: DropdownMenu,
}

export default meta

// type Story = StoryObj<typeof DropdownMenu>

/*
 *👇 Render functions are a framework specific feature to allow you control on how the component renders.
 * See https://storybook.js.org/docs/react/api/csf
 * to learn how to use render functions.
 */

export const Combobox = {
  args: {},
  render: ({}) => {
    const [open, setOpen] = React.useState(false)
    const [value, setValue] = React.useState('')

    const frameworks = [
      {
        value: 'next.js',
        label: 'Next.js',
      },
      {
        value: 'sveltekit',
        label: 'SvelteKit',
      },
      {
        value: 'nuxt.js',
        label: 'Nuxt.js',
      },
      {
        value: 'remix',
        label: 'Remix',
      },
      {
        value: 'astro',
        label: 'Astro',
      },
    ]

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[200px] justify-between"
          >
            {value
              ? frameworks.find((framework) => framework.value === value)?.label
              : 'Select framework...'}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0" side="bottom">
          <Command>
            <CommandInput placeholder="Search framework..." className="border-none ring-0" />
            <CommandEmpty>No framework found.</CommandEmpty>
            <CommandGroup>
              {frameworks.map((framework) => (
                <CommandItem
                  key={framework.value}
                  onSelect={(currentValue) => {
                    setValue(currentValue === value ? '' : currentValue)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === framework.value ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {framework.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    )
  },
}

export const PopoverExample = {
  args: {},
  render: ({}) => {
    type Status = {
      value: string
      label: string
      icon: LucideIcon
    }

    const statuses: Status[] = [
      {
        value: 'backlog',
        label: 'Backlog',
        icon: HelpCircle,
      },
      {
        value: 'todo',
        label: 'Todo',
        icon: Circle,
      },
      {
        value: 'in progress',
        label: 'In Progress',
        icon: ArrowUpCircle,
      },
      {
        value: 'done',
        label: 'Done',
        icon: CheckCircle2,
      },
      {
        value: 'canceled',
        label: 'Canceled',
        icon: XCircle,
      },
    ]

    const [open, setOpen] = React.useState(false)
    const [selectedStatus, setSelectedStatus] = React.useState<Status | null>(null)

    return (
      <div className="flex items-center space-x-4">
        <p className="text-sm text-foreground-muted">Status</p>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="w-[150px] justify-start">
              {selectedStatus ? (
                <>
                  <selectedStatus.icon className="mr-2 h-4 w-4 shrink-0" />
                  {selectedStatus.label}
                </>
              ) : (
                <>+ Set status</>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0" side="right" align="start">
            <Command>
              <CommandInput placeholder="Change status..." />
              <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup>
                  {statuses.map((status) => (
                    <CommandItem
                      value={status.value}
                      key={status.value}
                      onSelect={(value) => {
                        setSelectedStatus(
                          statuses.find((priority) => priority.value === value) || null
                        )
                        setOpen(false)
                      }}
                    >
                      <status.icon
                        className={cn(
                          'mr-2 h-4 w-4',
                          status.value === selectedStatus?.value ? 'opacity-100' : 'opacity-40'
                        )}
                      />
                      <span>{status.label}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    )
  },
}

export const DropdownExample = {
  args: {},
  render: ({}) => {
    const [label, setLabel] = React.useState('feature')
    const [open, setOpen] = React.useState(false)

    const labels = [
      'feature',
      'bug',
      'enhancement',
      'documentation',
      'design',
      'question',
      'maintenance',
    ]
    return (
      <div className="flex w-full flex-col items-start justify-between rounded-md border px-4 py-3 sm:flex-row sm:items-center">
        <p className="text-sm font-medium leading-none">
          <span className="mr-2 rounded-lg bg-primary px-2 py-1 text-xs text-primary-foreground">
            {label}
          </span>
          <span className="text-foreground-muted">Create a new project</span>
        </p>
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px]">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Assign to...
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Calendar className="mr-2 h-4 w-4" />
                Set due date...
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Tags className="mr-2 h-4 w-4" />
                  Apply label
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="p-0">
                  <Command>
                    <CommandInput placeholder="Filter label..." autoFocus={true} />
                    <CommandList>
                      <CommandEmpty>No label found.</CommandEmpty>
                      <CommandGroup>
                        {labels.map((label) => (
                          <CommandItem
                            key={label}
                            onSelect={(value) => {
                              setLabel(value)
                              setOpen(false)
                            }}
                          >
                            {label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">
                <Trash className="mr-2 h-4 w-4" />
                Delete
                <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )
  },
}

export const ReactHookFormDemo = {
  args: {},
  render: ({}) => {
    const languages = [
      { label: 'English', value: 'en' },
      { label: 'French', value: 'fr' },
      { label: 'German', value: 'de' },
      { label: 'Spanish', value: 'es' },
      { label: 'Portuguese', value: 'pt' },
      { label: 'Russian', value: 'ru' },
      { label: 'Japanese', value: 'ja' },
      { label: 'Korean', value: 'ko' },
      { label: 'Chinese', value: 'zh' },
    ] as const

    const FormSchema = z.object({
      language: z.string({
        required_error: 'Please select a language.',
      }),
    })

    const form = useForm<z.infer<typeof FormSchema>>({
      resolver: zodResolver(FormSchema),
    })

    function onSubmit(data: z.infer<typeof FormSchema>) {
      toast({
        title: 'You submitted the following values:',
        description: (
          <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
            <code className="text-white">{JSON.stringify(data, null, 2)}</code>
          </pre>
        ),
      })
    }

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
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
                          !field.value && 'text-foreground-muted'
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
                      <CommandInput placeholder="Search framework..." />
                      <CommandEmpty>No framework found.</CommandEmpty>
                      <CommandGroup>
                        {languages.map((language) => (
                          <CommandItem
                            value={language.value}
                            key={language.value}
                            onSelect={(value) => {
                              form.setValue('language', value)
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
          />
          <Button type="submit">Submit</Button>
        </form>
      </Form>
    )
  },
}

export const ComboOrgPicker = {
  args: {},
  render: ({}) => {
    type Status = {
      value: string
      label: string
      icon: LucideIcon
    }

    const personal: Status[] = [
      {
        value: 'summersmuir',
        label: 'Summersmuir',
        icon: HelpCircle,
      },
    ]

    const orgs: Status[] = [
      {
        value: 'supabase',
        label: 'Supabase',
        icon: Circle,
      },
      {
        value: 'supabaselabz',
        label: 'Supabase Labs',
        icon: ArrowUpCircle,
      },
      {
        value: 'supabasedemos',
        label: 'Supabase Demos',
        icon: CheckCircle2,
      },
    ]

    const [open, setOpen] = React.useState(false)
    const [selectedStatus, setSelectedStatus] = React.useState<Status | null>(null)
    console.log('selectedStatus:', selectedStatus)

    return (
      <div className="flex items-center space-x-4">
        <p className="text-sm text-foreground-muted">Status</p>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="w-[320px] justify-start">
              {selectedStatus ? (
                <>
                  <selectedStatus.icon className="mr-2 h-4 w-4 shrink-0" />
                  <span className="text-foreground">{selectedStatus.label}</span>
                </>
              ) : (
                <>Organization</>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0" side="bottom" align="start">
            <Command>
              <CommandInput placeholder="Find organization..." />
              <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <div className="my-2">
                  <CommandGroup heading="Personal Account">
                    {personal.map((status) => (
                      <Popover open={open}>
                        <PopoverTrigger asChild>
                          <CommandItem
                            key={status.value}
                            value={status.value}
                            onSelect={(value) => {
                              setSelectedStatus(
                                [...personal].find((priority) => priority.value === value) || null
                              )
                              setOpen(false)
                            }}
                          >
                            <status.icon
                              className={cn(
                                'mr-2 h-4 w-4',
                                status.value === selectedStatus?.value
                                  ? 'opacity-100'
                                  : 'opacity-40'
                              )}
                            />
                            <span>{status.label}</span>
                          </CommandItem>
                        </PopoverTrigger>
                        <PopoverContent className="p-0" side="right" align="start">
                          Hello world
                        </PopoverContent>
                      </Popover>
                    ))}
                  </CommandGroup>
                </div>
                <div className="my-2">
                  <CommandGroup heading="Your Organizations">
                    {orgs.map((status) => (
                      <CommandItem
                        key={status.value}
                        value={status.value}
                        onSelect={(value) => {
                          console.log(orgs)
                          setSelectedStatus(
                            [...orgs].find((priority) => {
                              console.log('value:', value)
                              console.log('priority:', priority)
                              return priority.value === value
                            }) || null
                          )
                          setOpen(false)
                        }}
                      >
                        <status.icon
                          className={cn(
                            'mr-2 h-4 w-4',
                            status.value === selectedStatus?.value ? 'opacity-100' : 'opacity-40'
                          )}
                        />
                        <span>{status.label}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </div>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    )
  },
}

export const MultipleComboPickers = {
  args: {},
  render: ({}) => {
    type Status = {
      value: string
      label: string
      icon: LucideIcon
    }

    const personal: Status[] = [
      {
        value: 'summersmuir',
        label: 'Summersmuir',
        icon: HelpCircle,
      },
    ]

    const orgs: Status[] = [
      {
        value: 'supabase',
        label: 'Supabase',
        icon: Circle,
      },
      {
        value: 'supabaselabz',
        label: 'Supabase Labs',
        icon: ArrowUpCircle,
      },
      {
        value: 'supabasedemos',
        label: 'Supabase Demos',
        icon: CheckCircle2,
      },
    ]

    const projects: Status[] = [
      {
        value: 'Next.js',
        icon: CheckCircle2,
        label: 'Next.js',
      },
      {
        value: 'supabase-studio-staging',
        icon: CheckCircle2,
        label: 'supabase-studio-staging',
      },
      {
        value: 'app.supabase.green',
        icon: CheckCircle2,
        label: 'app.supabase.green',
      },
      {
        value: 'studio-self-hosted.vercel.app',
        icon: CheckCircle2,
        label: 'studio-self-hosted.vercel.app',
      },
      {
        value: 'supabase.com',
        icon: CheckCircle2,
        label: 'supabase.com',
      },
      {
        value: 'supabase.green',
        icon: CheckCircle2,
        label: 'supabase.green',
      },
      {
        value: 'app.supabase.com',
        icon: CheckCircle2,
        label: 'app.supabase.com',
      },
      {
        value: 'supabase-studio.vercel.app',
        icon: CheckCircle2,
        label: 'supabase-studio.vercel.app',
      },
    ]

    const [open, setOpen] = React.useState(false)
    const [selectedStatus, setSelectedStatus] = React.useState<Status | null>(null)
    console.log('selectedStatus:', selectedStatus)

    return (
      <div className="flex items-center space-x-4">
        <p className="text-sm text-foreground-muted">Status</p>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="w-[320px] justify-start">
              {selectedStatus ? (
                <>
                  <selectedStatus.icon className="mr-2 h-4 w-4 shrink-0" />
                  <span className="text-foreground">{selectedStatus.label}</span>
                </>
              ) : (
                <>Organization</>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0 flex flex-row w-[520px]" side="bottom" align="start">
            <Command className="border-r h-full rounded-none grow">
              <CommandInput placeholder="Find organization..." />
              <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <div className="my-2">
                  <CommandGroup heading="Personal Account">
                    {personal.map((status) => {
                      return (
                        <CommandItem
                          key={status.value}
                          value={status.value}
                          onSelect={(value) => {
                            setSelectedStatus(
                              [...personal].find((priority) => priority.value === value) || null
                            )
                            setOpen(false)
                          }}
                        >
                          <status.icon
                            className={cn(
                              'mr-2 h-4 w-4',
                              status.value === selectedStatus?.value ? 'opacity-100' : 'opacity-40'
                            )}
                          />
                          <span>{status.label}</span>
                        </CommandItem>
                      )
                    })}
                  </CommandGroup>
                </div>
                <div className="my-2">
                  <CommandGroup heading="Your Organizations">
                    {orgs.map((status) => (
                      <CommandItem
                        key={status.value}
                        value={status.value}
                        onSelect={(value) => {
                          console.log(orgs)
                          setSelectedStatus(
                            [...orgs].find((priority) => {
                              console.log('value:', value)
                              console.log('priority:', priority)
                              return priority.value === value
                            }) || null
                          )
                          setOpen(false)
                        }}
                      >
                        <status.icon
                          className={cn(
                            'mr-2 h-4 w-4',
                            status.value === selectedStatus?.value ? 'opacity-100' : 'opacity-40'
                          )}
                        />
                        <span>{status.label}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </div>
              </CommandList>
            </Command>
            <Command>
              <CommandInput placeholder="Find project..." />
              <CommandList>
                <div className="my-2">
                  <CommandGroup heading="Your Projects">
                    {projects.map((status) => (
                      <CommandItem
                        key={status.value}
                        value={status.value}
                        onSelect={(value) => {
                          console.log(orgs)
                          setSelectedStatus(
                            [...orgs].find((priority) => {
                              console.log('value:', value)
                              console.log('priority:', priority)
                              return priority.value === value
                            }) || null
                          )
                          setOpen(false)
                        }}
                      >
                        <status.icon
                          className={cn(
                            'mr-2 h-4 w-4',
                            status.value === selectedStatus?.value ? 'opacity-100' : 'opacity-40'
                          )}
                        />
                        <span>{status.label}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </div>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    )
  },
}
