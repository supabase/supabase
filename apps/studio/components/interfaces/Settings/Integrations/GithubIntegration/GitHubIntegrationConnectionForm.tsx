import { zodResolver } from '@hookform/resolvers/zod'
import { GitBranch, RotateCcw, Shield } from 'lucide-react'
import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  cn,
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
} from 'ui'
import * as z from 'zod'

import { useBranchUpdateMutation } from 'data/branches/branch-update-mutation'
import { useBranchesQuery } from 'data/branches/branches-query'
import { useGithubConnectionUpdateMutation } from 'data/integrations/github-connection-update-mutate'
import { useGithubBranchesQuery } from 'data/integrations/integrations-github-branches-query'
import { Integration, IntegrationProjectConnection } from 'data/integrations/integrations.types'
import { useSelectedProject, useStore } from 'hooks'

const GitHubIntegrationConnectionForm = ({
  connection,
  integration,
}: {
  connection: IntegrationProjectConnection
  integration: Integration
}) => {
  const { ui } = useStore()
  const project = useSelectedProject()
  const [open, setOpen] = useState(false)
  const comboBoxRef = useRef<HTMLButtonElement>(null)

  const githubProjectIntegration = integration?.connections.find(
    (connection) => connection.supabase_project_ref === project?.parentRef
  )

  const [repoOwner, repoName] = githubProjectIntegration?.metadata.name.split('/') ?? []

  const {
    data: githubBranches,
    error: githubBranchesError,
    isLoading: isLoadingBranches,
    isSuccess: isSuccessBranches,
  } = useGithubBranchesQuery({
    organizationIntegrationId: integration?.id,
    repoOwner,
    repoName,
  })

  const { mutate: updateBranch, isLoading: isUpdatingProdBranch } = useBranchUpdateMutation({
    onSuccess: (data) => {
      ui.setNotification({
        category: 'success',
        message: `Changed Production Branch to ${data.git_branch}`,
      })
      setOpen(false)
    },
  })

  const { data: previewBranches, isLoading: isLoadingPreviewBranches } = useBranchesQuery(
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
  })
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      supabaseDirectory: connection?.metadata?.supabaseConfig?.supabaseDirectory,
    },
  })

  const { mutate: updateGithubConnection, isLoading: isUpdatingGithubConnection } =
    useGithubConnectionUpdateMutation({
      onSuccess: () => {
        ui.setNotification({ category: 'success', message: `Updated Supabase directory` })
        setOpen(false)
      },
    })

  function onSubmit(data: z.infer<typeof FormSchema>) {
    const metadata = {
      ...connection.metadata,
      supabaseConfig: {
        ...connection.metadata?.supabaseConfig,
        supabaseDirectory: data.supabaseDirectory,
      },
    }

    updateGithubConnection({
      id: connection.id,
      metadata,
      organizationIntegrationId: integration.id,
    })
  }

  return (
    <div className="flex flex-col gap-6 px-8 py-8">
      <div>
        <Label_Shadcn_ className="text-foreground">Production branch</Label_Shadcn_>
        <p className="text-xs text-foreground-light mb-3">
          All other branches will be treated as Preview branches
        </p>

        <Alert_Shadcn_ className="mb-4 w-96">
          <AlertTitle_Shadcn_ className="text-sm">
            Changing Git branch for Production Branch coming soon
          </AlertTitle_Shadcn_>
          <AlertDescription_Shadcn_ className="text-xs">
            If you wish to change the Git branch that is used for the Production Branch you will
            need to disable Branching and opt back in.
          </AlertDescription_Shadcn_>
        </Alert_Shadcn_>

        {/* <pre>! This should only work if branching is turned on !</pre> */}
        <Popover_Shadcn_ open={open} onOpenChange={setOpen} modal={false}>
          <PopoverTrigger_Shadcn_ asChild name="branch-selector">
            <Button
              disabled
              type="default"
              size="medium"
              ref={comboBoxRef}
              className={cn(
                'justify-start w-64',
                productionPreviewBranch?.git_branch === undefined ? 'text-foreground-light' : 'text'
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
                        value={branch.name}
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

      <Form_Shadcn_ {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FormLabel_Shadcn_ className="!text">Supabase directory</FormLabel_Shadcn_>
          <FormDescription_Shadcn_ className="text-xs text-foreground-lighter mb-3">
            Migration and seed SQL files will be run from this directory.
          </FormDescription_Shadcn_>

          <Alert_Shadcn_ className="mb-4 w-96">
            <AlertTitle_Shadcn_ className="text-sm">
              Changing Supabase directory is currently not supported
            </AlertTitle_Shadcn_>
            <AlertDescription_Shadcn_ className="text-xs">
              You will need to disable Branching and opt back into Branching to change the
              Production Branch. your Git repository.
            </AlertDescription_Shadcn_>
          </Alert_Shadcn_>

          <FormField_Shadcn_
            control={form.control}
            name="supabaseDirectory"
            render={({ field }) => (
              <FormItem_Shadcn_ className="flex flex-row items-center gap-3 !space-y-0">
                <FormControl_Shadcn_ className="xl:w-96">
                  <div className="relative">
                    <Input_Shadcn_
                      disabled
                      {...field}
                      onKeyPress={(event) => {
                        if (event.key === 'Escape') {
                          form.reset()
                        }
                      }}
                    />
                    <RotateCcw
                      className={cn(
                        'text-foreground-lighter transition hover:text cursor-pointer',
                        'w-4 h-4 absolute right-3 top-3',
                        'duration-150',
                        isUpdatingGithubConnection ||
                          field.value !== connection.metadata?.supabaseConfig?.supabaseDirectory
                          ? 'opacity-100 transition'
                          : 'opacity-0'
                      )}
                      onClick={() => form.reset()}
                    />
                  </div>
                </FormControl_Shadcn_>
                <Button
                  className={cn(
                    'duration-150',
                    isUpdatingGithubConnection ||
                      field.value !== connection.metadata?.supabaseConfig?.supabaseDirectory
                      ? 'opacity-100 transition'
                      : 'opacity-0'
                  )}
                  htmlType="submit"
                  type="secondary"
                  size="medium"
                  loading={isUpdatingGithubConnection}
                  disabled={
                    field.value === connection.metadata?.supabaseConfig?.supabaseDirectory ||
                    isUpdatingGithubConnection
                  }
                >
                  Update
                </Button>
              </FormItem_Shadcn_>
            )}
          />
        </form>
      </Form_Shadcn_>
    </div>
  )
}

export default GitHubIntegrationConnectionForm
