import { useMemo, useState, useEffect } from 'react'
import { toast } from 'sonner'

import { useGitHubAuthorizationQuery } from 'data/integrations/github-authorization-query'
import { useGitHubConnectionCreateMutation } from 'data/integrations/github-connection-create-mutation'
import { useGitHubConnectionDeleteMutation } from 'data/integrations/github-connection-delete-mutation'
import { useGitHubConnectionsQuery } from 'data/integrations/github-connections-query'
import { useGitHubRepositoriesQuery } from 'data/integrations/github-repositories-query'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { openInstallGitHubIntegrationWindow } from 'lib/github'
import { EMPTY_ARR } from 'lib/void'
import { useSidePanelsStateSnapshot } from 'state/side-panels'
import {
  Button,
  cn,
  SheetDescription,
  SheetFooter,
  Command_Shadcn_,
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  Popover_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
} from 'ui'
import { useBranchCreateMutation } from 'data/branches/branch-create-mutation'
import { useBranchUpdateMutation } from 'data/branches/branch-update-mutation'
import { useBranchesQuery } from 'data/branches/branches-query'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { useCheckGithubBranchValidity } from 'data/integrations/github-branch-check-query'
import { useGitHubConnectionUpdateMutation } from 'data/integrations/github-connection-update-mutation'
import {
  Form_Shadcn_,
  FormField_Shadcn_,
  FormControl_Shadcn_,
  FormMessage_Shadcn_,
  Input_Shadcn_,
  Switch,
} from 'ui'
import { Github, Loader2, Check, ChevronDown, DollarSign } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetSection } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { ForeignProject } from 'components/interfaces/Integrations/VercelGithub/ProjectLinker'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

export type SidePanelGitHubRepoLinkerProps = {
  projectRef?: string
}

const SidePanelGitHubRepoLinker = ({ projectRef }: SidePanelGitHubRepoLinkerProps) => {
  const selectedOrganization = useSelectedOrganization()
  const sidePanelStateSnapshot = useSidePanelsStateSnapshot()
  const selectedProject = useSelectedProject()
  const [foreignProjectsComboBoxOpen, setForeignProjectsComboboxOpen] = useState(false)
  const [selectedRepoId, setSelectedRepoId] = useState<string | undefined>()
  const [isConfirmingBranchChange, setIsConfirmingBranchChange] = useState(false)

  const visible = sidePanelStateSnapshot.githubConnectionsOpen

  const { data: gitHubAuthorization, isLoading: isLoadingGitHubAuthorization } =
    useGitHubAuthorizationQuery({ enabled: visible })

  // [Alaister]: temp override with <any> until the typegen is fixed
  const { data: githubReposData, isLoading: isLoadingGitHubRepos } = useGitHubRepositoriesQuery<
    any[]
  >({
    enabled: visible && Boolean(gitHubAuthorization),
  })

  const { data: connections } = useGitHubConnectionsQuery(
    {
      organizationId: selectedOrganization?.id,
    },
    {
      enabled: !!projectRef && visible,
    }
  )

  const existingConnection = useMemo(
    () => connections?.find((c) => c.project.ref === projectRef),
    [connections, projectRef]
  )

  useEffect(() => {
    if (existingConnection) {
      setSelectedRepoId(existingConnection.repository.id.toString())
    }
  }, [existingConnection])

  const githubRepos: ForeignProject[] = useMemo(
    () =>
      githubReposData?.map((repo: any) => ({
        id: repo.id.toString(),
        name: repo.name,
        installation_id: repo.installation_id,
      })) ?? EMPTY_ARR,
    [githubReposData]
  )

  const selectedRepo = useMemo(() => {
    return (githubReposData as any[])?.find((r) => r.id.toString() === selectedRepoId)
  }, [githubReposData, selectedRepoId])

  const { mutate: createBranch } = useBranchCreateMutation()
  const { mutate: updateBranch } = useBranchUpdateMutation()

  const { data: existingBranches } = useBranchesQuery(
    { projectRef },
    { enabled: !!projectRef && visible }
  )

  const isBranchingEnabled = selectedProject?.is_branch_enabled ?? false

  const { mutate: createConnection, isLoading: isCreatingConnection } =
    useGitHubConnectionCreateMutation({})

  const { mutateAsync: deleteConnection } = useGitHubConnectionDeleteMutation()

  // Form and config state
  const { mutateAsync: checkGithubBranchValidity, isLoading: isCheckingBranch } =
    useCheckGithubBranchValidity({ onError: () => {} })

  const { mutate: updateConnectionSettings, isLoading: isUpdatingConnection } =
    useGitHubConnectionUpdateMutation()

  const FormSchema = z
    .object({
      repo: z.string().optional(),
      autoBranchingEnabled: z.boolean().default(false),
      branchName: z.string(),
      supabaseDirectory: z.string().default(''),
      supabaseChangesOnly: z.boolean().default(false),
      branchLimit: z.string().default('50'),
    })
    .superRefine(async (val, ctx) => {
      if (val.autoBranchingEnabled) {
        if (!selectedRepo) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Please select a repository',
            path: ['repo'],
          })
        }
        if (val.branchName.length === 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Branch name cannot be empty',
            path: ['branchName'],
          })
          return
        }

        if (selectedRepo?.id && val.branchName && val.branchName.length > 0) {
          try {
            await checkGithubBranchValidity({
              repositoryId: Number(selectedRepo.id),
              branchName: val.branchName,
            })
          } catch (error) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `Branch "${val.branchName}" not found in repository`,
              path: ['branchName'],
            })
          }
        }
      }
    })

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    mode: 'onSubmit',
    reValidateMode: 'onBlur',
    defaultValues: {
      autoBranchingEnabled: false,
      branchName: 'main',
      supabaseDirectory: '',
      supabaseChangesOnly: false,
      branchLimit: '50',
    },
  })

  const autoBranchingEnabled = form.watch('autoBranchingEnabled')
  const prodBranch = existingBranches?.find((b: any) => b.is_default)
  const isCurrentlyEnabled = Boolean(existingConnection)

  let submitButtonText = 'Save'
  if (autoBranchingEnabled !== isCurrentlyEnabled) {
    submitButtonText = autoBranchingEnabled ? 'Enable' : 'Disable'
  }

  // Reset form whenever the repo / connection / branches change
  useEffect(() => {
    if (visible) {
      const isAutoBranchingEnabled = Boolean(existingConnection)

      if (existingConnection) {
        const defaults = {
          autoBranchingEnabled: isAutoBranchingEnabled,
          repo: existingConnection.repository.name,
          branchName: prodBranch?.git_branch ?? 'main',
          supabaseDirectory:
            (existingConnection as any)?.workdir ??
            (existingConnection as any)?.metadata?.supabaseConfig?.supabaseDirectory ??
            '',
          supabaseChangesOnly:
            (existingConnection as any)?.supabase_changes_only ??
            (existingConnection as any)?.metadata?.supabaseConfig?.supabaseChangesOnly ??
            false,
          branchLimit: String(
            ((existingConnection as any)?.branch_limit as number | undefined) ??
              (existingConnection as any)?.metadata?.supabaseConfig?.branchLimit ??
              50
          ),
        }

        form.reset(defaults)
      } else {
        form.reset({
          autoBranchingEnabled: isAutoBranchingEnabled,
          repo: '',
          branchName: 'main',
          supabaseDirectory: '',
          supabaseChangesOnly: false,
          branchLimit: '50',
        })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingConnection?.id, existingBranches, visible, prodBranch])

  useEffect(() => {
    if (selectedRepo && !existingConnection) {
      form.setValue('repo', selectedRepo.name)
      form.setValue('branchName', selectedRepo.default_branch ?? 'main')
    }
  }, [selectedRepo, existingConnection, form])

  // This saves connection settings and creates/updates branches which also enables branching if it's not already enabled
  const executeSave = async (data: z.infer<typeof FormSchema>) => {
    if (!projectRef) return console.error('Project ref missing')
    if (!selectedOrganization) return console.error('Organization not selected')

    const defaultBranch = data.branchName

    if (data.autoBranchingEnabled) {
      if (!selectedRepo) return toast.error('Please select a repository to connect to.')

      if (!isBranchingEnabled) {
        // create production branch (enables branching)
        createBranch({
          projectRef,
          branchName: defaultBranch,
          gitBranch: defaultBranch,
        })
      } else {
        if (prodBranch?.id) {
          updateBranch({
            id: prodBranch.id,
            projectRef,
            branchName: defaultBranch,
            gitBranch: defaultBranch,
          })
        }
      }

      if (existingConnection) {
        if (existingConnection.repository.id.toString() !== selectedRepo.id.toString()) {
          await deleteConnection({
            organizationId: selectedOrganization.id,
            connectionId: existingConnection.id,
          })
          createConnection({
            organizationId: selectedOrganization.id,
            connection: {
              installation_id: selectedRepo.installation_id!,
              project_ref: projectRef,
              repository_id: Number(selectedRepo.id),
              workdir: data.supabaseDirectory,
              supabaseChangesOnly: data.supabaseChangesOnly,
              branchLimit: Number(data.branchLimit),
            },
          })
        } else {
          updateConnectionSettings({
            connectionId: existingConnection.id,
            organizationId: selectedOrganization.id,
            workdir: data.supabaseDirectory,
            supabaseChangesOnly: data.supabaseChangesOnly,
            branchLimit: Number(data.branchLimit),
          })
        }
      } else {
        createConnection({
          organizationId: selectedOrganization.id,
          connection: {
            installation_id: selectedRepo.installation_id!,
            project_ref: projectRef,
            repository_id: Number(selectedRepo.id),
            workdir: data.supabaseDirectory,
            supabaseChangesOnly: data.supabaseChangesOnly,
            branchLimit: Number(data.branchLimit),
          },
        })
      }
      toast.success('Automatic branching enabled')
    } else {
      if (existingConnection) {
        await deleteConnection({
          organizationId: selectedOrganization.id,
          connectionId: existingConnection.id,
        })
        toast.success('Automatic branching disabled')
      }
    }
    setIsConfirmingBranchChange(false)
    sidePanelStateSnapshot.setGithubConnectionsOpen(false)
  }

  const handleSave = (data: z.infer<typeof FormSchema>) => {
    const originalBranchName = prodBranch?.git_branch

    if (
      existingConnection &&
      originalBranchName &&
      data.branchName !== originalBranchName &&
      data.autoBranchingEnabled
    ) {
      setIsConfirmingBranchChange(true)
    } else {
      executeSave(data)
    }
  }

  const onConfirmBranchChange = async () => {
    await executeSave(form.getValues())
  }

  return (
    <Sheet
      open={visible}
      onOpenChange={(open) => {
        if (!open) sidePanelStateSnapshot.setGithubConnectionsOpen(false)
      }}
    >
      <SheetContent side="right" showClose className="flex flex-col gap-0">
        <Form_Shadcn_ {...form}>
          <form
            onSubmit={form.handleSubmit(handleSave)}
            className="flex-1 overflow-hidden flex flex-col"
          >
            <SheetHeader className="shrink-0">
              <SheetTitle>Automatic Branching</SheetTitle>
              <SheetDescription>
                Create a Supabase branch for every GitHub branch and sync them on commit and merge.
              </SheetDescription>
            </SheetHeader>

            <SheetSection className="py-6 flex-1 overflow-y-auto">
              <FormField_Shadcn_
                control={form.control}
                name="autoBranchingEnabled"
                render={({ field }) => (
                  <FormItemLayout
                    className={'mb-4'}
                    layout="flex-row-reverse"
                    label="Enable automatic branching"
                    description="Once enabled, new branches will be created for every new GitHub branch"
                  >
                    <FormControl_Shadcn_>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={!gitHubAuthorization}
                      />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />

              {/* GitHub authorization prompt if needed */}
              {gitHubAuthorization === null ? (
                <div className="flex flex-col items-center justify-center relative border rounded-lg p-12 bg shadow px-20s">
                  <p className="text-sm text-center">
                    Connect your Supabase projects with your GitHub repositories
                  </p>
                  <p className="text-sm text-center text-foreground-light">
                    Authorize with GitHub to retrieve your GitHub repositories
                  </p>
                  <Button
                    className="w-min mt-3"
                    onClick={() => {
                      openInstallGitHubIntegrationWindow('authorize')
                    }}
                  >
                    Authorize GitHub
                  </Button>
                </div>
              ) : (
                <div
                  className={cn(
                    'flex flex-col gap-4',
                    !autoBranchingEnabled && 'opacity-25 pointer-events-none'
                  )}
                >
                  <FormField_Shadcn_
                    control={form.control}
                    name="repo"
                    render={({ field }) => (
                      <FormItemLayout
                        layout="flex-row-reverse"
                        label="Connected Repo"
                        description="The GitHub repository you want to connect to."
                      >
                        <FormControl_Shadcn_>
                          <Popover_Shadcn_
                            open={foreignProjectsComboBoxOpen}
                            onOpenChange={setForeignProjectsComboboxOpen}
                          >
                            <PopoverTrigger_Shadcn_ asChild>
                              <Button
                                type="default"
                                block
                                disabled={isLoadingGitHubRepos || !autoBranchingEnabled}
                                loading={isLoadingGitHubRepos}
                                className="justify-start h-[34px]"
                                icon={<Github size={16} className="text-foreground-light" />}
                                iconRight={
                                  <span className="grow flex justify-end">
                                    <ChevronDown />
                                  </span>
                                }
                              >
                                {selectedRepo?.name ?? 'Choose a repository'}
                              </Button>
                            </PopoverTrigger_Shadcn_>
                            <PopoverContent_Shadcn_
                              className="p-0 !w-72"
                              side="bottom"
                              align="center"
                            >
                              <Command_Shadcn_>
                                <CommandInput_Shadcn_ placeholder="Search for a repository" />
                                <CommandList_Shadcn_ className="!max-h-[170px]">
                                  <CommandEmpty_Shadcn_>No results found.</CommandEmpty_Shadcn_>
                                  <CommandGroup_Shadcn_>
                                    {githubRepos.map((repo) => (
                                      <CommandItem_Shadcn_
                                        key={repo.id}
                                        value={repo.name}
                                        className="flex gap-2 items-center"
                                        onSelect={() => {
                                          if (repo.id === selectedRepoId) {
                                            setForeignProjectsComboboxOpen(false)
                                            return
                                          }
                                          const newRepoData = (githubReposData as any[])?.find(
                                            (r) => r.id.toString() === repo.id
                                          )
                                          form.reset({
                                            autoBranchingEnabled:
                                              form.getValues('autoBranchingEnabled'),
                                            repo: newRepoData.name,
                                            branchName: newRepoData.default_branch ?? 'main',
                                            supabaseDirectory: '',
                                            supabaseChangesOnly: false,
                                            branchLimit: '50',
                                          })
                                          setSelectedRepoId(repo.id)
                                          setForeignProjectsComboboxOpen(false)
                                        }}
                                      >
                                        <Github size={16} className="text-foreground-light" />
                                        <span className="truncate" title={repo.name}>
                                          {repo.name}
                                        </span>
                                      </CommandItem_Shadcn_>
                                    ))}
                                  </CommandGroup_Shadcn_>
                                </CommandList_Shadcn_>
                              </Command_Shadcn_>
                            </PopoverContent_Shadcn_>
                          </Popover_Shadcn_>
                        </FormControl_Shadcn_>
                      </FormItemLayout>
                    )}
                  />

                  <FormField_Shadcn_
                    control={form.control}
                    name="branchName"
                    render={({ field }) => (
                      <FormItemLayout
                        layout="flex-row-reverse"
                        label="Production git branch name"
                        description="Sync a git branch to your production Supabase branch"
                      >
                        <div className="relative w-full">
                          <FormControl_Shadcn_>
                            <Input_Shadcn_
                              {...field}
                              autoComplete="off"
                              disabled={!autoBranchingEnabled}
                            />
                          </FormControl_Shadcn_>
                          <div className="absolute top-2.5 right-3 flex items-center gap-2">
                            {isCheckingBranch && <Loader2 size={14} className="animate-spin" />}
                            {field.value &&
                              !isCheckingBranch &&
                              !form.formState.errors.branchName &&
                              autoBranchingEnabled && (
                                <Check size={14} className="text-brand" strokeWidth={2} />
                              )}
                          </div>
                        </div>
                      </FormItemLayout>
                    )}
                  />

                  <FormField_Shadcn_
                    control={form.control}
                    name="supabaseDirectory"
                    render={({ field }) => (
                      <FormItemLayout
                        layout="flex-row-reverse"
                        label="Supabase directory"
                        description="Relative path to your supabase directory."
                      >
                        <FormControl_Shadcn_>
                          <Input_Shadcn_
                            {...field}
                            placeholder="supabase"
                            autoComplete="off"
                            disabled={!autoBranchingEnabled}
                          />
                        </FormControl_Shadcn_>
                        <FormMessage_Shadcn_ />
                      </FormItemLayout>
                    )}
                  />

                  <FormField_Shadcn_
                    control={form.control}
                    name="branchLimit"
                    render={({ field }) => (
                      <FormItemLayout
                        layout="flex-row-reverse"
                        label="Branch limit"
                        description="Maximum preview branches that can be created automatically."
                      >
                        <FormControl_Shadcn_>
                          <Input_Shadcn_
                            {...field}
                            type="number"
                            autoComplete="off"
                            disabled={!autoBranchingEnabled}
                          />
                        </FormControl_Shadcn_>
                        <FormMessage_Shadcn_ />
                      </FormItemLayout>
                    )}
                  />

                  <FormField_Shadcn_
                    control={form.control}
                    name="supabaseChangesOnly"
                    render={({ field }) => (
                      <FormItemLayout
                        layout="flex-row-reverse"
                        label="Supabase changes only"
                        description="Only trigger branch creation when files inside the Supabase directory change."
                      >
                        <FormControl_Shadcn_>
                          <Switch
                            checked={field.value}
                            onCheckedChange={(val) => field.onChange(val)}
                            disabled={!autoBranchingEnabled}
                          />
                        </FormControl_Shadcn_>
                      </FormItemLayout>
                    )}
                  />
                </div>
              )}
            </SheetSection>
            <SheetFooter className="shrink-0 block p-0">
              {autoBranchingEnabled && (
                <div className="flex flex-row items-center gap-4 p-4 bg border-b">
                  <figure className="w-10 h-10 rounded-md border flex items-center justify-center">
                    <DollarSign className="text-info" size={20} strokeWidth={2} />
                  </figure>
                  <div>
                    <p className="text-sm text-foreground">
                      Preview branches are billed $0.32 per day
                    </p>
                    <p className="text-sm text-foreground-light">
                      This cost will continue for as long as the branch is active
                    </p>
                  </div>
                </div>
              )}
              <div className="flex justify-end gap-2 p-4">
                <Button
                  type="default"
                  size="small"
                  onClick={() => sidePanelStateSnapshot.setGithubConnectionsOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="primary"
                  size="small"
                  htmlType="submit"
                  loading={isUpdatingConnection || isCreatingConnection}
                  disabled={
                    isUpdatingConnection ||
                    isCreatingConnection ||
                    isCheckingBranch ||
                    isLoadingGitHubAuthorization ||
                    isLoadingGitHubRepos
                  }
                >
                  {submitButtonText}
                </Button>
              </div>
            </SheetFooter>
          </form>
        </Form_Shadcn_>
        <ConfirmationModal
          variant="warning"
          visible={isConfirmingBranchChange}
          title="Changing production git branch"
          confirmLabel="Confirm"
          size="medium"
          onCancel={() => setIsConfirmingBranchChange(false)}
          onConfirm={onConfirmBranchChange}
          loading={isUpdatingConnection || isCreatingConnection}
        >
          <p className="text-sm text-foreground-light">
            Open pull requests will only update your Supabase project on merge if the git base
            branch matches this new production git branch.
          </p>
        </ConfirmationModal>
      </SheetContent>
    </Sheet>
  )
}

export default SidePanelGitHubRepoLinker
