import { zodResolver } from '@hookform/resolvers/zod'
import { GitBranch, RotateCcw, Shield } from 'lucide-react'
import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  Command_Shadcn_,
  FormControl_Shadcn_,
  FormDescription_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  FormLabel_Shadcn_,
  Form_Shadcn_,
  IconCheck,
  IconChevronDown,
  Input_Shadcn_,
  Label_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
  Switch,
  cn,
} from 'ui'
import * as z from 'zod'

import { useBranchUpdateMutation } from 'data/branches/branch-update-mutation'
import { useBranchesQuery } from 'data/branches/branches-query'
import { useGitHubBranchesQuery } from 'data/integrations/github-branches-query'
import { useGitHubConnectionUpdateMutation } from 'data/integrations/github-connection-update-mutation'
import type { IntegrationProjectConnection } from 'data/integrations/integrations.types'
import { useSelectedOrganization, useSelectedProject } from 'hooks'

interface GitHubIntegrationConnectionFormProps {
  connection: IntegrationProjectConnection
}

const GitHubIntegrationConnectionForm = ({ connection }: GitHubIntegrationConnectionFormProps) => {
  const org = useSelectedOrganization()
  const project = useSelectedProject()
  const [open, setOpen] = useState(false)
  const comboBoxRef = useRef<HTMLButtonElement>(null)
  const isBranchingEnabled =
    project?.is_branch_enabled === true || project?.parent_project_ref !== undefined

  const { data: githubBranches, isLoading: isLoadingBranches } = useGitHubBranchesQuery(
    {
      connectionId: Number(connection.id),
    },
    { enabled: isBranchingEnabled }
  )

  const { mutate: updateConnection, isLoading: isUpdatingConnection } =
    useGitHubConnectionUpdateMutation({
      onSuccess: () => toast.success('Successfully updated connection settings'),
    })

  const { mutate: updateBranch, isLoading: isUpdatingProdBranch } = useBranchUpdateMutation({
    onSuccess: (data) => {
      toast.success(`Successfully updated production branch to ${data.git_branch}`)
      setOpen(false)
    },
  })

  const { data: previewBranches } = useBranchesQuery(
    { projectRef: project?.parentRef },
    { enabled: project !== undefined }
  )

  const productionPreviewBranch = previewBranches?.find((branch) => branch.is_default)

  function onUpdateProductionBranch(branchName: string) {
    if (!project?.parentRef) return
    if (!productionPreviewBranch) return
    updateBranch({
      id: productionPreviewBranch.id,
      projectRef: project.parentRef,
      branchName: branchName,
      gitBranch: branchName,
    })
  }

  const FormSchema = z.object({
    supabaseDirectory: z
      .string()
      .default(connection.metadata?.supabaseConfig?.supabaseDirectory ?? ''),
    supabaseChangesOnly: z
      .boolean()
      .default(connection.metadata?.supabaseConfig?.supabaseChangesOnly ?? false),
  })
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      supabaseDirectory: connection?.metadata?.supabaseConfig?.supabaseDirectory,
      supabaseChangesOnly: connection?.metadata?.supabaseConfig?.supabaseChangesOnly,
    },
  })

  function onSubmit(data: z.infer<typeof FormSchema>) {
    if (org?.id === undefined) return console.error('Org ID is required')
    updateConnection({
      connectionId: connection.id,
      organizationId: org?.id,
      workdir: data.supabaseDirectory,
      supabaseChangesOnly: data.supabaseChangesOnly,
    })
  }

  return (
    <div className="flex flex-col gap-6 px-6 py-4">
      {isBranchingEnabled && (
        <div>
          <Label_Shadcn_ className="text-foreground">Production branch</Label_Shadcn_>
          <p className="text-xs text-foreground-light mb-3">
            All other branches will be treated as Preview branches
          </p>

          {/* <pre>! This should only work if branching is turned on !</pre> */}

          <Popover_Shadcn_ open={open} onOpenChange={setOpen} modal={false}>
            <PopoverTrigger_Shadcn_ asChild name="branch-selector">
              <Button
                disabled
                type="default"
                size="medium"
                ref={comboBoxRef}
                className={cn(
                  'justify-start w-80 mt-4',
                  productionPreviewBranch?.git_branch === undefined
                    ? 'text-foreground-light'
                    : 'text'
                )}
                icon={
                  productionPreviewBranch?.git_branch && (
                    <Shield className="w-4 h-4 text-warning" strokeWidth={1} />
                  )
                }
                loading={isUpdatingProdBranch || isLoadingBranches}
                iconRight={
                  <span className="grow flex justify-end">
                    <IconChevronDown className={''} />
                  </span>
                }
              >
                {productionPreviewBranch?.git_branch || 'Select a branch'}
              </Button>
            </PopoverTrigger_Shadcn_>
            <PopoverContent_Shadcn_
              className="p-0"
              side="bottom"
              align="start"
              style={{ width: comboBoxRef.current?.offsetWidth }}
            >
              <Command_Shadcn_>
                <CommandInput_Shadcn_ placeholder="Find branch..." />
                <CommandList_Shadcn_>
                  <CommandEmpty_Shadcn_>No branches found</CommandEmpty_Shadcn_>
                  <CommandGroup_Shadcn_>
                    {githubBranches?.map((branch) => {
                      const active = branch.name === productionPreviewBranch?.git_branch
                      return (
                        <CommandItem_Shadcn_
                          key={branch.name}
                          value={(branch.name as string).replaceAll('"', '')}
                          className="cursor-pointer w-full flex items-center justify-between"
                          onSelect={() => {
                            setOpen(false)
                            onUpdateProductionBranch(branch.name)
                          }}
                        >
                          <div className="flex items-center gap-2">
                            {active ? (
                              <Shield className="w-4 h-4 text-warning" strokeWidth={1} />
                            ) : (
                              <GitBranch className="w-4 h-4" strokeWidth={1} />
                            )}
                            {branch.name}
                          </div>
                          {branch.name === productionPreviewBranch?.git_branch && <IconCheck />}
                        </CommandItem_Shadcn_>
                      )
                    })}
                  </CommandGroup_Shadcn_>
                </CommandList_Shadcn_>
              </Command_Shadcn_>
            </PopoverContent_Shadcn_>
          </Popover_Shadcn_>
        </div>
      )}

      <Form_Shadcn_ {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
          <FormField_Shadcn_
            control={form.control}
            name="supabaseDirectory"
            render={({ field }) => (
              <FormItem_Shadcn_ className="flex flex-col">
                <FormLabel_Shadcn_ className="!text">Supabase directory</FormLabel_Shadcn_>
                <FormDescription_Shadcn_ className="text-xs text-foreground-lighter !mt-0 !mb-1">
                  Path in your repository where <code>supabase</code> directory for this connection
                  lives.
                </FormDescription_Shadcn_>
                <FormControl_Shadcn_ className="flex gap-3">
                  <div className="relative">
                    <Input_Shadcn_
                      {...field}
                      className="w-80"
                      onKeyPress={(event) => {
                        if (event.key === 'Escape') form.reset()
                      }}
                    />
                    <RotateCcw
                      className={cn(
                        'text-foreground-lighter transition hover:text cursor-pointer',
                        'w-4 h-4 absolute right-3 top-3',
                        'duration-150',

                        field.value !== connection.metadata?.supabaseConfig?.supabaseDirectory
                          ? 'opacity-100 transition'
                          : 'opacity-0'
                      )}
                      onClick={() => form.reset()}
                    />
                    <Button
                      loading={isUpdatingConnection}
                      className={cn(
                        'duration-150 transition',
                        field.value !== connection.metadata?.supabaseConfig?.supabaseDirectory
                          ? 'opacity-100'
                          : 'opacity-0'
                      )}
                      htmlType="submit"
                      disabled={
                        field.value === '' ||
                        field.value === connection.metadata?.supabaseConfig?.supabaseDirectory
                      }
                    >
                      Update
                    </Button>
                  </div>
                </FormControl_Shadcn_>
              </FormItem_Shadcn_>
            )}
          />

          <FormField_Shadcn_
            control={form.control}
            name="supabaseChangesOnly"
            render={({ field }) => (
              <FormItem_Shadcn_ className="space-y-0 flex gap-x-4">
                <FormControl_Shadcn_>
                  <Switch
                    className="mt-1"
                    checked={field.value}
                    onCheckedChange={(e) => {
                      field.onChange(e)
                      form.handleSubmit(onSubmit)()
                    }}
                  />
                </FormControl_Shadcn_>
                <div>
                  <FormLabel_Shadcn_ className="!text">Supabase changes only</FormLabel_Shadcn_>
                  <FormDescription_Shadcn_ className="text-xs text-foreground-lighter">
                    Trigger branch creation only when there were changes to <code>supabase</code>{' '}
                    directory.
                  </FormDescription_Shadcn_>
                </div>
              </FormItem_Shadcn_>
            )}
          />
        </form>
      </Form_Shadcn_>
    </div>
  )
}

export default GitHubIntegrationConnectionForm
