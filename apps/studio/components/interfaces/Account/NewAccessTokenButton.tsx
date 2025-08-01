import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronDown, ExternalLink, Plus, X, Key, Check, Box, Copy } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { type SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { useAccessTokenCreateMutation } from 'data/access-tokens/access-tokens-create-mutation'
import {
  Button,
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Form_Shadcn_,
  FormField_Shadcn_,
  FormControl_Shadcn_,
  Input_Shadcn_,
  Select_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  ToggleGroup,
  ToggleGroupItem,
  Command_Shadcn_,
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  Popover_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  WarningIcon,
  ScrollArea,
  cn,
} from 'ui'
import { Admonition } from 'ui-patterns'
import {
  MultiSelector,
  MultiSelectorContent,
  MultiSelectorItem,
  MultiSelectorList,
  MultiSelectorTrigger,
} from 'ui-patterns/multi-select'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import CopyButton from 'components/ui/CopyButton'

import {
  ACCESS_TOKEN_PERMISSIONS,
  ACCESS_TOKEN_EXPIRY,
  ACCESS_TOKEN_ORGS,
  ACCESS_TOKEN_PROJECTS,
} from './AccessToken.constants'

export interface NewAccessTokenButtonProps {
  onCreateToken: (token: any) => void
}

const PermissionRowSchema = z.object({
  resource: z.string().min(1, 'Please select a resource'),
  action: z.string().min(1, 'Please select an action'),
})

const TokenSchema = z.object({
  tokenName: z.string().min(1, 'Please enter a name for the token'),
  expirationDate: z.enum(['No expiry', '7 days', '30 days', '90 days', '180 days']),
  resourceAccess: z.enum(['all-orgs', 'selected-orgs', 'selected-projects']),
  selectedOrganizations: z.array(z.string()).optional(),
  selectedProjects: z.array(z.string()).optional(),
  organizationPermissions: z.record(z.string(), z.string()).optional(),
  projectPermissions: z.record(z.string(), z.string()).optional(),
  permissionRows: z.array(PermissionRowSchema).optional(),
})

// Create a flat list of all available resources for the searchable dropdown
const ALL_RESOURCES = ACCESS_TOKEN_PERMISSIONS.flatMap((group) =>
  group.resources.map((resource) => ({
    resource: resource.resource,
    title: resource.title,
    actions: resource.actions,
    group: group.name,
  }))
)

const NewAccessTokenButton = ({ onCreateToken }: NewAccessTokenButtonProps) => {
  const [visible, setVisible] = useState(false)
  const [tokenScope, setTokenScope] = useState<'V0' | undefined>(undefined)
  const [generatedToken, setGeneratedToken] = useState<any>(null)
  const [resourceSearchOpen, setResourceSearchOpen] = useState(false)

  const form = useForm<z.infer<typeof TokenSchema>>({
    resolver: zodResolver(TokenSchema),
    defaultValues: {
      tokenName: '',
      expirationDate: 'No expiry',
      resourceAccess: 'all-orgs',
      selectedOrganizations: [],
      selectedProjects: [],
      organizationPermissions: {},
      projectPermissions: {},
      permissionRows: [],
    },
    mode: 'onSubmit',
  })
  const { mutate: createAccessToken, isLoading } = useAccessTokenCreateMutation()

  const resourceAccess = form.watch('resourceAccess')
  const expirationDate = form.watch('expirationDate')
  const permissionRows = form.watch('permissionRows') || []

  // Calculate expiration date for display
  const getExpirationDateText = (expiryOption: string) => {
    if (expiryOption === 'No expiry') return 'Token never expires'

    const now = new Date()
    let expirationDate: Date

    switch (expiryOption) {
      case '7 days':
        expirationDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
        break
      case '30 days':
        expirationDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
        break
      case '90 days':
        expirationDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)
        break
      case '180 days':
        expirationDate = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000)
        break
      default:
        return 'Token never expires'
    }

    return `Token expires ${expirationDate.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })}`
  }

  const onSubmit: SubmitHandler<z.infer<typeof TokenSchema>> = async (values) => {
    // Validate that at least one permission is configured
    if (!permissionRows || permissionRows.length === 0) {
      toast.error('Please configure at least one permission.')
      return
    }

    // Validate that all permission rows have both resource and action
    const hasValidPermissions = permissionRows.every((row) => row.resource && row.action)
    if (!hasValidPermissions) {
      toast.error('Please ensure all permissions have both resource and action selected.')
      return
    }

    createAccessToken(
      { name: values.tokenName, scope: tokenScope },
      {
        onSuccess: (data) => {
          console.log('Generated token data:', data)
          setGeneratedToken(data)
          onCreateToken(data)
        },
      }
    )
  }

  const handleClose = () => {
    form.reset({
      tokenName: '',
      expirationDate: 'No expiry',
      resourceAccess: 'all-orgs',
      selectedOrganizations: [],
      selectedProjects: [],
      organizationPermissions: {},
      projectPermissions: {},
      permissionRows: [],
    })
    setVisible(false)
    setGeneratedToken(null)
  }

  const handleDismiss = () => {
    handleClose()
  }

  return (
    <>
      <div className="flex items-center">
        <Button
          className="rounded-r-none px-3"
          onClick={() => {
            setTokenScope(undefined)
            setVisible(true)
          }}
        >
          Generate new token
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="primary"
              title="Choose token scope"
              className="rounded-l-none px-[4px] py-[5px]"
              icon={<ChevronDown />}
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="bottom">
            <DropdownMenuItem
              key="experimental-token"
              onClick={() => {
                setTokenScope('V0')
                setVisible(true)
              }}
            >
              <div className="space-y-1">
                <p className="block text-foreground">Generate token for experimental API</p>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Sheet
        open={visible}
        onOpenChange={(open) => {
          if (!open) handleClose()
          setVisible(open)
        }}
      >
        <SheetContent
          showClose={false}
          size="default"
          className="!min-w-[600px] flex flex-col h-full gap-0"
        >
          <SheetHeader>
            <SheetTitle>
              {generatedToken
                ? 'Token Generated Successfully'
                : tokenScope === 'V0'
                  ? 'Generate token for experimental API'
                  : 'Generate New Token'}
            </SheetTitle>
          </SheetHeader>
          <ScrollArea className="flex-1 max-h-[calc(100vh-116px)]">
            <div className="flex flex-col gap-4 overflow-visible p-4">
              {tokenScope === 'V0' && (
                <Admonition
                  type="warning"
                  title="The experimental API provides additional endpoints which allows you to manage your organizations and projects."
                  description={
                    <>
                      <p>
                        These include deleting organizations and projects which cannot be undone. As
                        such, be very careful when using this API.
                      </p>
                      <div className="mt-4">
                        <Button asChild type="default" icon={<ExternalLink />}>
                          <Link
                            href="https://api.supabase.com/api/v0"
                            target="_blank"
                            rel="noreferrer"
                          >
                            Experimental API documentation
                          </Link>
                        </Button>
                      </div>
                    </>
                  }
                />
              )}

              {!generatedToken ? (
                <Form_Shadcn_ {...form}>
                  <div className="flex flex-col gap-6 overflow-visible">
                    {/* Basic Information Section */}
                    <div className="space-y-4">
                      <FormField_Shadcn_
                        key="tokenName"
                        name="tokenName"
                        control={form.control}
                        render={({ field }) => (
                          <FormItemLayout name="tokenName" label="Name">
                            <FormControl_Shadcn_>
                              <Input_Shadcn_
                                id="tokenName"
                                {...field}
                                placeholder="Provide a name for your token"
                              />
                            </FormControl_Shadcn_>
                          </FormItemLayout>
                        )}
                      />

                      <FormField_Shadcn_
                        key="expirationDate"
                        name="expirationDate"
                        control={form.control}
                        render={({ field }) => (
                          <FormItemLayout
                            name="expirationDate"
                            label="Expiration date"
                            labelOptional={getExpirationDateText(expirationDate)}
                          >
                            <FormControl_Shadcn_>
                              <Select_Shadcn_ value={field.value} onValueChange={field.onChange}>
                                <SelectTrigger_Shadcn_>
                                  <SelectValue_Shadcn_ placeholder="Select expiration date" />
                                </SelectTrigger_Shadcn_>
                                <SelectContent_Shadcn_>
                                  {ACCESS_TOKEN_EXPIRY.map((expiry) => (
                                    <SelectItem_Shadcn_ key={expiry} value={expiry}>
                                      {expiry}
                                    </SelectItem_Shadcn_>
                                  ))}
                                </SelectContent_Shadcn_>
                              </Select_Shadcn_>
                            </FormControl_Shadcn_>
                          </FormItemLayout>
                        )}
                      />
                    </div>

                    {/* Resource Access Section */}
                    <div className="space-y-4">
                      <FormField_Shadcn_
                        key="resourceAccess"
                        name="resourceAccess"
                        control={form.control}
                        render={({ field }) => (
                          <FormItemLayout name="resourceAccess" label="Resource access">
                            <FormControl_Shadcn_>
                              <div className="space-y-3">
                                <fieldset className="flex gap-3">
                                  <label
                                    className={cn(
                                      'border border-default rounded-md bg-surface-200 hover:bg-overlay-hover hover:border-control px-4 py-3 cursor-pointer transition-colors flex-1 flex flex-col',
                                      field.value === 'all-orgs' &&
                                        'border-foreground-muted hover:border-foreground-muted bg-surface-300'
                                    )}
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' || e.key === ' ') {
                                        field.onChange('all-orgs')
                                      }
                                    }}
                                  >
                                    <div className="flex justify-between items-start mb-3">
                                      <Box size={16} className="text-foreground-light" />
                                      {field.value === 'all-orgs' && (
                                        <div className="flex items-center justify-center p-0.5 bg-foreground text-background rounded-full">
                                          <Check
                                            size={12}
                                            strokeWidth="4"
                                            className="text-background"
                                          />
                                        </div>
                                      )}
                                    </div>
                                    <span
                                      className={cn(
                                        'text-sm',
                                        field.value === 'all-orgs'
                                          ? 'text-foreground'
                                          : 'text-foreground-light'
                                      )}
                                    >
                                      Everything
                                    </span>
                                    <input
                                      type="radio"
                                      name="resourceAccess"
                                      value="all-orgs"
                                      checked={field.value === 'all-orgs'}
                                      onChange={() => field.onChange('all-orgs')}
                                      className="invisible h-0 w-0 border-0"
                                    />
                                  </label>

                                  <label
                                    className={cn(
                                      'border border-default rounded-md bg-surface-200 hover:bg-overlay-hover hover:border-control px-4 py-3 cursor-pointer transition-colors flex-1 flex flex-col',
                                      field.value === 'selected-orgs' &&
                                        'border-foreground-muted hover:border-foreground-muted bg-surface-300'
                                    )}
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' || e.key === ' ') {
                                        field.onChange('selected-orgs')
                                      }
                                    }}
                                  >
                                    <div className="flex justify-between items-start mb-3">
                                      <Box size={16} className="text-foreground-light" />
                                      {field.value === 'selected-orgs' && (
                                        <div className="flex items-center justify-center p-0.5 bg-foreground text-background rounded-full">
                                          <Check
                                            size={12}
                                            strokeWidth="4"
                                            className="text-background"
                                          />
                                        </div>
                                      )}
                                    </div>
                                    <span
                                      className={cn(
                                        'text-sm',
                                        field.value === 'selected-orgs'
                                          ? 'text-foreground'
                                          : 'text-foreground-light'
                                      )}
                                    >
                                      Selected orgs
                                    </span>
                                    <input
                                      type="radio"
                                      name="resourceAccess"
                                      value="selected-orgs"
                                      checked={field.value === 'selected-orgs'}
                                      onChange={() => field.onChange('selected-orgs')}
                                      className="invisible h-0 w-0 border-0"
                                    />
                                  </label>

                                  <label
                                    className={cn(
                                      'border border-default rounded-md bg-surface-200 hover:bg-overlay-hover hover:border-control px-4 py-3 cursor-pointer transition-colors flex-1 flex flex-col',
                                      field.value === 'selected-projects' &&
                                        'border-foreground-muted hover:border-foreground-muted bg-surface-300'
                                    )}
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' || e.key === ' ') {
                                        field.onChange('selected-projects')
                                      }
                                    }}
                                  >
                                    <div className="flex justify-between items-start mb-3">
                                      <Box size={16} className="text-foreground-light" />
                                      {field.value === 'selected-projects' && (
                                        <div className="flex items-center justify-center p-0.5 bg-foreground text-background rounded-full">
                                          <Check
                                            size={12}
                                            strokeWidth="4"
                                            className="text-background"
                                          />
                                        </div>
                                      )}
                                    </div>
                                    <span
                                      className={cn(
                                        'text-sm',
                                        field.value === 'selected-projects'
                                          ? 'text-foreground'
                                          : 'text-foreground-light'
                                      )}
                                    >
                                      Selected projects
                                    </span>
                                    <input
                                      type="radio"
                                      name="resourceAccess"
                                      value="selected-projects"
                                      checked={field.value === 'selected-projects'}
                                      onChange={() => field.onChange('selected-projects')}
                                      className="invisible h-0 w-0 border-0"
                                    />
                                  </label>
                                </fieldset>

                                {field.value === 'all-orgs' && (
                                  <p className="text-foreground-light text-sm">
                                    Access to all projects across all organizations you have access
                                    to.
                                  </p>
                                )}

                                {field.value === 'selected-orgs' && (
                                  <p className="text-foreground-light text-sm">
                                    Access only to the organizations you have specified.
                                  </p>
                                )}

                                {field.value === 'selected-projects' && (
                                  <p className="text-foreground-light text-sm">
                                    Access only to the projects you have specified.
                                  </p>
                                )}
                              </div>
                            </FormControl_Shadcn_>
                          </FormItemLayout>
                        )}
                      />

                      {resourceAccess === 'selected-orgs' && (
                        <FormField_Shadcn_
                          key="selectedOrganizations"
                          name="selectedOrganizations"
                          control={form.control}
                          render={({ field }) => (
                            <FormItemLayout
                              name="selectedOrganizations"
                              label="Select organizations"
                            >
                              <FormControl_Shadcn_ className="overflow-visible">
                                <MultiSelector
                                  values={field.value || []}
                                  onValuesChange={field.onChange}
                                >
                                  <MultiSelectorTrigger
                                    deletableBadge
                                    showIcon={false}
                                    mode="inline-combobox"
                                    label="Select organizations"
                                    badgeLimit="wrap"
                                  />
                                  <MultiSelectorContent className="z-50">
                                    <MultiSelectorList>
                                      {ACCESS_TOKEN_ORGS.map((org) => (
                                        <MultiSelectorItem key={org} value={org}>
                                          {org}
                                        </MultiSelectorItem>
                                      ))}
                                    </MultiSelectorList>
                                  </MultiSelectorContent>
                                </MultiSelector>
                              </FormControl_Shadcn_>
                            </FormItemLayout>
                          )}
                        />
                      )}

                      {resourceAccess === 'selected-projects' && (
                        <FormField_Shadcn_
                          key="selectedProjects"
                          name="selectedProjects"
                          control={form.control}
                          render={({ field }) => (
                            <FormItemLayout name="selectedProjects" label="Select projects">
                              <FormControl_Shadcn_ className="overflow-visible">
                                <MultiSelector
                                  values={field.value || []}
                                  onValuesChange={field.onChange}
                                >
                                  <MultiSelectorTrigger
                                    deletableBadge
                                    showIcon={false}
                                    mode="inline-combobox"
                                    label="Select projects"
                                    badgeLimit="wrap"
                                  />
                                  <MultiSelectorContent className="z-50">
                                    <MultiSelectorList>
                                      {ACCESS_TOKEN_PROJECTS.map((project) => (
                                        <MultiSelectorItem key={project} value={project}>
                                          {project}
                                        </MultiSelectorItem>
                                      ))}
                                    </MultiSelectorList>
                                  </MultiSelectorContent>
                                </MultiSelector>
                              </FormControl_Shadcn_>
                            </FormItemLayout>
                          )}
                        />
                      )}
                    </div>

                    {/* Permissions Section */}
                    <div className="space-y-4">
                      {permissionRows.length === 0 ? (
                        <div className="space-y-3">
                          <span className="text-sm">Configure permissions</span>
                          <div className="text-center py-8 border border-dashed border-border rounded-lg">
                            <p className="text-sm text-foreground-light mb-4">
                              No permissions configured yet.
                            </p>
                            <Popover_Shadcn_
                              open={resourceSearchOpen}
                              onOpenChange={setResourceSearchOpen}
                            >
                              <PopoverTrigger_Shadcn_ asChild>
                                <Button type="default" icon={<Plus className="h-4 w-4" />}>
                                  Add permission
                                </Button>
                              </PopoverTrigger_Shadcn_>
                              <PopoverContent_Shadcn_ className="w-[400px] p-0" align="center">
                                <Command_Shadcn_>
                                  <CommandInput_Shadcn_ placeholder="Search resources..." />
                                  <CommandList_Shadcn_>
                                    <CommandEmpty_Shadcn_>No resources found.</CommandEmpty_Shadcn_>

                                    {/* Preset Options */}
                                    <CommandGroup_Shadcn_ heading="Preset options">
                                      <CommandItem_Shadcn_
                                        value="add-all-permissions"
                                        onSelect={() => {
                                          const allPermissions = ALL_RESOURCES.map((resource) => ({
                                            resource: resource.resource,
                                            action: resource.actions.includes('read-write')
                                              ? 'read-write'
                                              : resource.actions[0],
                                          }))
                                          form.setValue('permissionRows', allPermissions)
                                          setResourceSearchOpen(false)
                                        }}
                                      >
                                        <div className="flex items-center gap-3">
                                          <Key size={12} />
                                          <div className="flex flex-col text-left">
                                            <span className="font-medium text-foreground">
                                              Add all permissions
                                            </span>
                                            <span className="text-xs text-foreground-light">
                                              Add all available permissions with read-write access
                                            </span>
                                          </div>
                                        </div>
                                      </CommandItem_Shadcn_>

                                      <CommandItem_Shadcn_
                                        value="add-all-project-permissions"
                                        onSelect={() => {
                                          const projectPermissions = ALL_RESOURCES.filter(
                                            (resource) => resource.group === 'Project permissions'
                                          ).map((resource) => ({
                                            resource: resource.resource,
                                            action: resource.actions.includes('read-write')
                                              ? 'read-write'
                                              : resource.actions[0],
                                          }))
                                          form.setValue('permissionRows', projectPermissions)
                                          setResourceSearchOpen(false)
                                        }}
                                      >
                                        <div className="flex items-center gap-3">
                                          <Key size={12} />
                                          <div className="flex flex-col text-left">
                                            <span className="font-medium text-foreground">
                                              Add all project permissions
                                            </span>
                                            <span className="text-xs text-foreground-light">
                                              Add all project-related permissions
                                            </span>
                                          </div>
                                        </div>
                                      </CommandItem_Shadcn_>

                                      <CommandItem_Shadcn_
                                        value="add-all-organization-permissions"
                                        onSelect={() => {
                                          const orgPermissions = ALL_RESOURCES.filter(
                                            (resource) =>
                                              resource.group === 'Organization permissions'
                                          ).map((resource) => ({
                                            resource: resource.resource,
                                            action: resource.actions.includes('read-write')
                                              ? 'read-write'
                                              : resource.actions[0],
                                          }))
                                          form.setValue('permissionRows', orgPermissions)
                                          setResourceSearchOpen(false)
                                        }}
                                      >
                                        <div className="flex items-center gap-3">
                                          <Key size={12} />
                                          <div className="flex flex-col text-left">
                                            <span className="font-medium text-foreground">
                                              Add all organization permissions
                                            </span>
                                            <span className="text-xs text-foreground-light">
                                              Add all organization-related permissions
                                            </span>
                                          </div>
                                        </div>
                                      </CommandItem_Shadcn_>
                                    </CommandGroup_Shadcn_>

                                    <CommandGroup_Shadcn_ heading="Individual permissions">
                                      {ALL_RESOURCES.map((resource) => (
                                        <CommandItem_Shadcn_
                                          key={resource.resource}
                                          value={resource.resource}
                                          onSelect={() => {
                                            const newRows = [
                                              ...permissionRows,
                                              { resource: resource.resource, action: '' },
                                            ]
                                            form.setValue('permissionRows', newRows)
                                            setResourceSearchOpen(false)
                                          }}
                                        >
                                          <div className="flex items-center gap-3">
                                            <Key size={12} />
                                            <div className="flex flex-col text-left">
                                              <span className="font-medium text-foreground">
                                                {resource.title}
                                              </span>
                                              <span className="text-xs text-foreground-light">
                                                {resource.group}
                                              </span>
                                            </div>
                                          </div>
                                        </CommandItem_Shadcn_>
                                      ))}
                                    </CommandGroup_Shadcn_>
                                  </CommandList_Shadcn_>
                                </Command_Shadcn_>
                              </PopoverContent_Shadcn_>
                            </Popover_Shadcn_>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Configure permissions</span>
                            <Popover_Shadcn_
                              open={resourceSearchOpen}
                              onOpenChange={setResourceSearchOpen}
                            >
                              <PopoverTrigger_Shadcn_ asChild>
                                <Button
                                  type="default"
                                  size="tiny"
                                  icon={<Plus className="h-4 w-4" />}
                                >
                                  Add permission
                                </Button>
                              </PopoverTrigger_Shadcn_>
                              <PopoverContent_Shadcn_ className="w-[400px] p-0" align="end">
                                <Command_Shadcn_>
                                  <CommandInput_Shadcn_ placeholder="Search resources..." />
                                  <CommandList_Shadcn_>
                                    <CommandEmpty_Shadcn_>No resources found.</CommandEmpty_Shadcn_>

                                    {/* Preset Options */}
                                    <CommandGroup_Shadcn_ heading="Preset options">
                                      <CommandItem_Shadcn_
                                        value="add-all-permissions"
                                        onSelect={() => {
                                          const allPermissions = ALL_RESOURCES.map((resource) => ({
                                            resource: resource.resource,
                                            action: resource.actions.includes('read-write')
                                              ? 'read-write'
                                              : resource.actions[0],
                                          }))
                                          form.setValue('permissionRows', allPermissions)
                                          setResourceSearchOpen(false)
                                        }}
                                      >
                                        <div className="flex items-center gap-3">
                                          <Key size={12} />
                                          <div className="flex flex-col text-left">
                                            <span className="font-medium text-foreground">
                                              Add all permissions
                                            </span>
                                            <span className="text-xs text-foreground-light">
                                              Add all available permissions with read-write access
                                            </span>
                                          </div>
                                        </div>
                                      </CommandItem_Shadcn_>

                                      <CommandItem_Shadcn_
                                        value="add-all-project-permissions"
                                        onSelect={() => {
                                          const projectPermissions = ALL_RESOURCES.filter(
                                            (resource) => resource.group === 'Project permissions'
                                          ).map((resource) => ({
                                            resource: resource.resource,
                                            action: resource.actions.includes('read-write')
                                              ? 'read-write'
                                              : resource.actions[0],
                                          }))
                                          form.setValue('permissionRows', projectPermissions)
                                          setResourceSearchOpen(false)
                                        }}
                                      >
                                        <div className="flex items-center gap-3">
                                          <Key size={12} />
                                          <div className="flex flex-col text-left">
                                            <span className="font-medium text-foreground">
                                              Add all project permissions
                                            </span>
                                            <span className="text-xs text-foreground-light">
                                              Add all project-related permissions
                                            </span>
                                          </div>
                                        </div>
                                      </CommandItem_Shadcn_>

                                      <CommandItem_Shadcn_
                                        value="add-all-organization-permissions"
                                        onSelect={() => {
                                          const orgPermissions = ALL_RESOURCES.filter(
                                            (resource) =>
                                              resource.group === 'Organization permissions'
                                          ).map((resource) => ({
                                            resource: resource.resource,
                                            action: resource.actions.includes('read-write')
                                              ? 'read-write'
                                              : resource.actions[0],
                                          }))
                                          form.setValue('permissionRows', orgPermissions)
                                          setResourceSearchOpen(false)
                                        }}
                                      >
                                        <div className="flex items-center gap-3">
                                          <Key size={12} />
                                          <div className="flex flex-col text-left">
                                            <span className="font-medium text-foreground">
                                              Add all organization permissions
                                            </span>
                                            <span className="text-xs text-foreground-light">
                                              Add all organization-related permissions
                                            </span>
                                          </div>
                                        </div>
                                      </CommandItem_Shadcn_>
                                    </CommandGroup_Shadcn_>

                                    <CommandGroup_Shadcn_ heading="Individual permissions">
                                      {ALL_RESOURCES.map((resource) => (
                                        <CommandItem_Shadcn_
                                          key={resource.resource}
                                          value={resource.resource}
                                          onSelect={() => {
                                            const newRows = [
                                              ...permissionRows,
                                              { resource: resource.resource, action: '' },
                                            ]
                                            form.setValue('permissionRows', newRows)
                                            setResourceSearchOpen(false)
                                          }}
                                        >
                                          <div className="flex items-center gap-3">
                                            <Key size={12} />
                                            <div className="flex flex-col text-left">
                                              <span className="font-medium">{resource.title}</span>
                                              <span className="text-xs text-foreground-light">
                                                {resource.group}
                                              </span>
                                            </div>
                                          </div>
                                        </CommandItem_Shadcn_>
                                      ))}
                                    </CommandGroup_Shadcn_>
                                  </CommandList_Shadcn_>
                                </Command_Shadcn_>
                              </PopoverContent_Shadcn_>
                            </Popover_Shadcn_>
                          </div>

                          <div className="border border-border rounded-lg">
                            {permissionRows.map((row, index) => {
                              const selectedResource = ALL_RESOURCES.find(
                                (r) => r.resource === row.resource
                              )
                              return (
                                <div key={index}>
                                  <div className="flex items-center gap-3 p-3">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <div className="flex flex-col">
                                          <span className="text-sm font-medium truncate max-w-[24ch]">
                                            {selectedResource?.title}
                                          </span>
                                          <span className="text-xs text-foreground-light">
                                            {selectedResource?.group}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {selectedResource && (
                                        <Select_Shadcn_
                                          value={row.action}
                                          onValueChange={(value) => {
                                            const newRows = [...permissionRows]
                                            newRows[index] = { ...newRows[index], action: value }
                                            form.setValue('permissionRows', newRows)
                                          }}
                                        >
                                          <SelectTrigger_Shadcn_ className="w-[150px] h-7">
                                            <SelectValue_Shadcn_ placeholder="Set access" />
                                          </SelectTrigger_Shadcn_>
                                          <SelectContent_Shadcn_>
                                            {selectedResource.actions.map((action) => (
                                              <SelectItem_Shadcn_ key={action} value={action}>
                                                {action.charAt(0).toUpperCase() + action.slice(1)}
                                              </SelectItem_Shadcn_>
                                            ))}
                                          </SelectContent_Shadcn_>
                                        </Select_Shadcn_>
                                      )}
                                      <Button
                                        type="text"
                                        size="tiny"
                                        className="p-1"
                                        onClick={() => {
                                          const newRows = permissionRows.filter(
                                            (_, i) => i !== index
                                          )
                                          form.setValue('permissionRows', newRows)
                                        }}
                                        icon={<X size={16} />}
                                      />
                                    </div>
                                  </div>
                                  {index < permissionRows.length - 1 && (
                                    <div className="border-t border-border" />
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      <div className="w-full flex gap-x-2 items-center">
                        <WarningIcon />
                        <span className="text-xs text-left text-foreground-lighter">
                          Once you've set these permissions, you cannot edit them.
                        </span>
                      </div>
                    </div>
                  </div>
                </Form_Shadcn_>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <p className="text-sm text-foreground-light">
                      Do copy this access token and store it in a secure place - you will not be
                      able to see it again.
                    </p>
                    <div className="flex items-center gap-2">
                      <Input_Shadcn_
                        value={
                          generatedToken?.access_token ||
                          generatedToken?.token_alias ||
                          generatedToken?.token ||
                          ''
                        }
                        readOnly
                        className="flex-1 input-mono"
                        id="generatedToken"
                      />
                      <CopyButton
                        text={
                          generatedToken?.access_token ||
                          generatedToken?.token_alias ||
                          generatedToken?.token ||
                          ''
                        }
                        onCopy={() => toast.success('Access token copied to clipboard')}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          <SheetFooter className="!justify-end w-full mt-auto pt-4 border-t">
            {!generatedToken ? (
              <div className="flex gap-2">
                <Button type="default" disabled={isLoading} onClick={handleClose}>
                  Cancel
                </Button>
                <Button onClick={form.handleSubmit(onSubmit)} loading={isLoading}>
                  Generate token
                </Button>
              </div>
            ) : (
              <Button type="default" onClick={handleClose}>
                Done
              </Button>
            )}
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  )
}

export default NewAccessTokenButton
