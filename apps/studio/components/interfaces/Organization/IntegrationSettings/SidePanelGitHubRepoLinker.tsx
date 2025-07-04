import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { ChevronDown, Loader2, PlusIcon } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'

import { Markdown } from 'components/interfaces/Markdown'
import { useBranchCreateMutation } from 'data/branches/branch-create-mutation'
import { useBranchUpdateMutation } from 'data/branches/branch-update-mutation'
import { useBranchesQuery } from 'data/branches/branches-query'
import { useCheckGithubBranchValidity } from 'data/integrations/github-branch-check-query'
import { useGitHubAuthorizationQuery } from 'data/integrations/github-authorization-query'
import { useGitHubConnectionCreateMutation } from 'data/integrations/github-connection-create-mutation'
import { useGitHubConnectionDeleteMutation } from 'data/integrations/github-connection-delete-mutation'
import { useGitHubConnectionUpdateMutation } from 'data/integrations/github-connection-update-mutation'
import { useGitHubConnectionsQuery } from 'data/integrations/github-connections-query'
import { useGitHubRepositoriesQuery } from 'data/integrations/github-repositories-query'
import type { GitHubConnection } from 'data/integrations/integrations.types'
import { useProjectsQuery } from 'data/projects/projects-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { openInstallGitHubIntegrationWindow } from 'lib/github'
import { EMPTY_ARR } from 'lib/void'
import { useSidePanelsStateSnapshot } from 'state/side-panels'
import {
  Button,
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  CommandSeparator_Shadcn_,
  Command_Shadcn_,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Input_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  Switch,
  cn,
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

const GITHUB_ICON = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 98 96" className="w-6">
    <path
      fill="#ffffff"
      fillRule="evenodd"
      d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z"
      clipRule="evenodd"
    />
  </svg>
)

export type SidePanelGitHubRepoLinkerProps = {
  projectRef?: string
}

const SidePanelGitHubRepoLinker = ({ projectRef }: SidePanelGitHubRepoLinkerProps) => {
  const selectedProject = useSelectedProject()
  const selectedOrganization = useSelectedOrganization()
  const sidePanelStateSnapshot = useSidePanelsStateSnapshot()

  const [isConfirmingBranchChange, setIsConfirmingBranchChange] = useState(false)
  const [isConfirmingRepoChange, setIsConfirmingRepoChange] = useState(false)
  const [selectedRepositoryId, setSelectedRepositoryId] = useState<string | undefined>()
  const [repoComboBoxOpen, setRepoComboboxOpen] = useState(false)

  const visible = sidePanelStateSnapshot.githubConnectionsOpen

  const canUpdateGitHubConnection = useCheckPermissions(
    PermissionAction.UPDATE,
    'integrations.github_connections'
  )
  const canCreateGitHubConnection = useCheckPermissions(
    PermissionAction.CREATE,
    'integrations.github_connections'
  )

  const { data: gitHubAuthorization, isLoading: isLoadingGitHubAuthorization } =
    useGitHubAuthorizationQuery({ enabled: visible })

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
      enabled: visible,
    }
  )

  const { data: existingBranches } = useBranchesQuery(
    { projectRef: selectedProject?.ref },
    { enabled: !!selectedProject?.ref }
  )

  const githubRepos = useMemo(
    () =>
      githubReposData?.map((repo: any) => ({
        id: repo.id.toString(),
        name: repo.name,
        installation_id: repo.installation_id,
      })) ?? EMPTY_ARR,
    [githubReposData]
  )

  const existingConnection = useMemo(
    () => connections?.find((c) => c.project.ref === projectRef),
    [connections, projectRef]
  )

  const prodBranch = existingBranches?.find((branch) => branch.is_default)

  // Mutations
  const { mutate: createBranch } = useBranchCreateMutation({
    onError: (error) => {
      console.error('Failed to enable branching:', error)
    },
  })

  const { mutate: updateBranch } = useBranchUpdateMutation()

  const { mutateAsync: checkGithubBranchValidity, isLoading: isCheckingBranch } =
    useCheckGithubBranchValidity({ onError: () => {} })

  const { mutate: createConnection, isLoading: isCreatingConnection } =
    useGitHubConnectionCreateMutation({
      onSuccess: (data, variables) => {
        // Enable branching if not already enabled
        if (selectedProject && !selectedProject.is_branch_enabled) {
          createBranch({
            projectRef: variables.connection.project_ref,
            branchName: 'main',
            gitBranch: '',
          })
        }
        toast.success('Successfully linked project to repository!')
      },
    })

  const { mutateAsync: deleteConnection } = useGitHubConnectionDeleteMutation()

  const { mutate: updateConnectionSettings, isLoading: isUpdatingConnection } =
    useGitHubConnectionUpdateMutation()

  // Form schema with validation
  const GitHubSettingsSchema = z
    .object({
      repositoryId: z.string().min(1, 'Please select a repository'),
      enableProductionSync: z.boolean().default(false),
      branchName: z.string(),
      new_branch_per_pr: z.boolean().default(false),
      supabaseDirectory: z.string().default('.'),
      supabaseChangesOnly: z.boolean().default(false),
      branchLimit: z.string().default('50'),
    })
    .superRefine(async (val, ctx) => {
      if (
        val.enableProductionSync &&
        val.branchName &&
        val.branchName.length > 0 &&
        val.repositoryId
      ) {
        try {
          await checkGithubBranchValidity({
            repositoryId: Number(val.repositoryId),
            branchName: val.branchName,
          })
        } catch (error) {
          const selectedRepo = githubRepos.find((repo) => repo.id === val.repositoryId)
          const repoName = selectedRepo?.name || 'selected repository'
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Branch "${val.branchName}" not found in ${repoName}`,
            path: ['branchName'],
          })
        }
      }
    })

  const githubSettingsForm = useForm<z.infer<typeof GitHubSettingsSchema>>({
    resolver: zodResolver(GitHubSettingsSchema),
    mode: 'onSubmit',
    reValidateMode: 'onBlur',
    defaultValues: {
      repositoryId: '',
      enableProductionSync: false,
      branchName: '',
      new_branch_per_pr: false,
      supabaseDirectory: '',
      supabaseChangesOnly: false,
      branchLimit: '50',
    },
  })

  const enableProductionSync = githubSettingsForm.watch('enableProductionSync')
  const newBranchPerPr = githubSettingsForm.watch('new_branch_per_pr')
  const currentRepositoryId = githubSettingsForm.watch('repositoryId')

  // Calculate selected repository based on current form value
  const selectedRepository = githubRepos.find(
    (repo) => repo.id === (currentRepositoryId || selectedRepositoryId)
  )

  // Initialize form when existing connection is loaded
  useEffect(() => {
    if (existingConnection) {
      const hasGitBranch = Boolean(prodBranch?.git_branch?.trim())
      const formValues = {
        repositoryId: existingConnection.repository.id.toString(),
        enableProductionSync: hasGitBranch,
        branchName: prodBranch?.git_branch || 'main',
        new_branch_per_pr: existingConnection.new_branch_per_pr,
        supabaseDirectory: existingConnection.workdir || '',
        supabaseChangesOnly: existingConnection.supabase_changes_only,
        branchLimit: String(existingConnection.branch_limit),
      }

      // Only reset if the form hasn't been modified or if the connection has actually changed
      if (
        !githubSettingsForm.formState.isDirty ||
        githubSettingsForm.getValues().repositoryId !== formValues.repositoryId
      ) {
        githubSettingsForm.reset(formValues)
        setSelectedRepositoryId(existingConnection.repository.id.toString())
      }
    }
  }, [existingConnection?.id, prodBranch?.git_branch, prodBranch?.id])

  // Handle clearing branch name when production sync is disabled
  useEffect(() => {
    if (!enableProductionSync) {
      githubSettingsForm.setValue('branchName', '')
    } else if (enableProductionSync && !githubSettingsForm.getValues().branchName) {
      githubSettingsForm.setValue('branchName', 'main')
    }
  }, [enableProductionSync, githubSettingsForm])

  const handleCreateOrUpdateConnection = async (data: z.infer<typeof GitHubSettingsSchema>) => {
    if (!selectedProject?.ref || !selectedOrganization?.id) return

    const selectedRepo = githubRepos.find((repo) => repo.id === data.repositoryId)
    if (!selectedRepo) {
      toast.error('Please select a repository')
      return
    }

    try {
      if (existingConnection) {
        // Check if repository is being changed
        const isRepoChanged = existingConnection.repository.id.toString() !== data.repositoryId
        if (isRepoChanged) {
          setIsConfirmingRepoChange(true)
          return
        }
        // Update existing connection
        await handleUpdateConnection(data, existingConnection)
      } else {
        // Create new connection
        await handleCreateConnection(data, selectedRepo)
      }
    } catch (error) {
      console.error('Error managing connection:', error)
    }
  }

  const handleCreateConnection = async (
    data: z.infer<typeof GitHubSettingsSchema>,
    selectedRepo: { id: string; installation_id: number }
  ) => {
    if (!selectedProject?.ref || !selectedOrganization?.id) return

    // Create the connection
    createConnection({
      organizationId: selectedOrganization.id,
      connection: {
        installation_id: selectedRepo.installation_id,
        project_ref: selectedProject.ref,
        repository_id: Number(selectedRepo.id),
        workdir: data.supabaseDirectory,
        supabase_changes_only: data.supabaseChangesOnly,
        branch_limit: Number(data.branchLimit),
        new_branch_per_pr: data.new_branch_per_pr,
      },
    })

    // Handle branch creation/update for production sync
    if (data.enableProductionSync && data.branchName) {
      if (prodBranch?.id) {
        updateBranch({
          id: prodBranch.id,
          projectRef: selectedProject.ref,
          gitBranch: data.branchName,
        })
      } else {
        // Create new branch if none exists
        createBranch({
          projectRef: selectedProject.ref,
          branchName: 'main',
          gitBranch: data.branchName,
        })
      }
    }

    toast.success('GitHub connection created successfully')
    sidePanelStateSnapshot.setGithubConnectionsOpen(false)
  }

  const handleUpdateConnection = async (
    data: z.infer<typeof GitHubSettingsSchema>,
    connection: GitHubConnection
  ) => {
    if (!selectedProject?.ref || !selectedOrganization?.id) return

    const originalBranchName = prodBranch?.git_branch

    if (originalBranchName && data.branchName !== originalBranchName && data.enableProductionSync) {
      setIsConfirmingBranchChange(true)
      return
    }

    await executeUpdate(data, connection)
  }

  const executeUpdate = async (
    data: z.infer<typeof GitHubSettingsSchema>,
    connection: GitHubConnection
  ) => {
    if (!selectedProject?.ref || !selectedOrganization?.id) return

    // Update connection settings
    updateConnectionSettings({
      connectionId: connection.id,
      organizationId: selectedOrganization.id,
      connection: {
        workdir: data.supabaseDirectory,
        supabase_changes_only: data.supabaseChangesOnly,
        branch_limit: Number(data.branchLimit),
        new_branch_per_pr: data.new_branch_per_pr,
      },
    })

    // Handle branch update
    if (prodBranch?.id) {
      updateBranch({
        id: prodBranch.id,
        projectRef: selectedProject.ref,
        gitBranch: data.enableProductionSync ? data.branchName : '',
      })
    }

    toast.success('GitHub integration updated successfully')
    setIsConfirmingBranchChange(false)
    sidePanelStateSnapshot.setGithubConnectionsOpen(false)
  }

  const onConfirmBranchChange = async () => {
    if (existingConnection) {
      await executeUpdate(githubSettingsForm.getValues(), existingConnection)
    }
  }

  const onConfirmRepoChange = async () => {
    const data = githubSettingsForm.getValues()
    const selectedRepo = githubRepos.find((repo) => repo.id === data.repositoryId)

    if (!selectedRepo || !existingConnection) return

    try {
      // Delete the existing connection
      await deleteConnection({
        organizationId: selectedOrganization!.id,
        connectionId: existingConnection.id,
      })

      // Create new connection with the new repository
      await handleCreateConnection(data, selectedRepo)

      setIsConfirmingRepoChange(false)
    } catch (error) {
      console.error('Error changing repository:', error)
      toast.error('Failed to change repository')
    }
  }

  const isConnected = Boolean(existingConnection)
  const isLoading = isCreatingConnection || isUpdatingConnection

  return (
    <>
      <Sheet
        open={visible}
        onOpenChange={(open) => !open && sidePanelStateSnapshot.setGithubConnectionsOpen(false)}
      >
        <SheetContent size="lg" className="flex flex-col">
          <SheetHeader>
            <SheetTitle>GitHub Integration</SheetTitle>
            <SheetDescription>
              {isConnected
                ? 'Update your GitHub integration settings below.'
                : 'Connect your Supabase project to a GitHub repository to enable automatic deployments and preview branches.'}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-5">
            {gitHubAuthorization === null ? (
              <div className="flex flex-col items-center justify-center mt-2 relative border rounded-lg p-12 bg shadow">
                <p className="text-sm text-center">Authorize with GitHub</p>
                <p className="text-sm text-center text-foreground-light">
                  Connect your GitHub account to access and select repositories for integration.
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
              <Form_Shadcn_ {...githubSettingsForm}>
                <form
                  onSubmit={githubSettingsForm.handleSubmit(handleCreateOrUpdateConnection)}
                  className="space-y-6"
                >
                  {/* Repository Selection */}
                  <FormField_Shadcn_
                    control={githubSettingsForm.control}
                    name="repositoryId"
                    render={({ field }) => (
                      <FormItemLayout
                        layout="flex-row-reverse"
                        label="GitHub Repository"
                        description="Select the repository to connect to your project"
                      >
                        <Popover_Shadcn_ open={repoComboBoxOpen} onOpenChange={setRepoComboboxOpen}>
                          <PopoverTrigger_Shadcn_ asChild>
                            <FormControl_Shadcn_>
                              <Button
                                type="default"
                                className="justify-start h-[34px] w-full"
                                disabled={isLoadingGitHubRepos}
                                loading={isLoadingGitHubRepos}
                                icon={
                                  <div className="bg-black shadow rounded p-1 w-6 h-6 flex justify-center items-center">
                                    {GITHUB_ICON}
                                  </div>
                                }
                                iconRight={
                                  <span className="grow flex justify-end">
                                    <ChevronDown />
                                  </span>
                                }
                              >
                                {selectedRepository
                                  ? selectedRepository.name
                                  : 'Choose GitHub Repository'}
                              </Button>
                            </FormControl_Shadcn_>
                          </PopoverTrigger_Shadcn_>
                          <PopoverContent_Shadcn_ className="p-0 w-80" side="bottom" align="start">
                            <Command_Shadcn_>
                              <CommandInput_Shadcn_ placeholder="Search repositories..." />
                              <CommandList_Shadcn_ className="!max-h-[200px]">
                                <CommandEmpty_Shadcn_>No repositories found.</CommandEmpty_Shadcn_>
                                <CommandGroup_Shadcn_>
                                  {githubRepos.map((repo, i) => (
                                    <CommandItem_Shadcn_
                                      key={repo.id}
                                      value={`${repo.name.replaceAll('"', '')}-${i}`}
                                      className="flex gap-2 items-center"
                                      onSelect={() => {
                                        setSelectedRepositoryId(repo.id)
                                        field.onChange(repo.id)
                                        setRepoComboboxOpen(false)
                                      }}
                                    >
                                      <div className="bg-black shadow rounded p-1 w-5 h-5 flex justify-center items-center">
                                        {GITHUB_ICON}
                                      </div>
                                      <span className="truncate" title={repo.name}>
                                        {repo.name}
                                      </span>
                                    </CommandItem_Shadcn_>
                                  ))}
                                </CommandGroup_Shadcn_>
                                <CommandSeparator_Shadcn_ />
                                <CommandGroup_Shadcn_>
                                  <CommandItem_Shadcn_
                                    className="flex gap-2 items-center cursor-pointer"
                                    onSelect={() => openInstallGitHubIntegrationWindow('install')}
                                  >
                                    <PlusIcon size={16} />
                                    Add GitHub Repositories
                                  </CommandItem_Shadcn_>
                                </CommandGroup_Shadcn_>
                              </CommandList_Shadcn_>
                            </Command_Shadcn_>
                          </PopoverContent_Shadcn_>
                        </Popover_Shadcn_>
                      </FormItemLayout>
                    )}
                  />

                  {/* Supabase Directory */}
                  <FormField_Shadcn_
                    control={githubSettingsForm.control}
                    name="supabaseDirectory"
                    render={({ field }) => (
                      <FormItemLayout
                        layout="flex-row-reverse"
                        label="Supabase directory"
                        description="Relative path to your supabase folder"
                      >
                        <FormControl_Shadcn_>
                          <Input_Shadcn_
                            {...field}
                            placeholder="supabase"
                            autoComplete="off"
                            disabled={!canUpdateGitHubConnection}
                          />
                        </FormControl_Shadcn_>
                      </FormItemLayout>
                    )}
                  />

                  {/* Production Branch Sync Section */}
                  <div className="space-y-4">
                    <FormField_Shadcn_
                      control={githubSettingsForm.control}
                      name="enableProductionSync"
                      render={({ field }) => (
                        <FormItemLayout
                          layout="flex-row-reverse"
                          label="Deploy to production"
                          description="Deploy changes to production on push including PR merges"
                        >
                          <FormControl_Shadcn_>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={!canUpdateGitHubConnection}
                            />
                          </FormControl_Shadcn_>
                        </FormItemLayout>
                      )}
                    />

                    <div
                      className={cn(
                        'space-y-4 pl-6 border-l',
                        !enableProductionSync && 'opacity-25 pointer-events-none'
                      )}
                    >
                      <FormField_Shadcn_
                        control={githubSettingsForm.control}
                        name="branchName"
                        render={({ field }) => (
                          <FormItemLayout
                            layout="flex-row-reverse"
                            label="Production branch name"
                            description="The GitHub branch to sync with your production database (e.g., main, master)"
                          >
                            <div className="relative w-full">
                              <FormControl_Shadcn_>
                                <Input_Shadcn_
                                  {...field}
                                  autoComplete="off"
                                  disabled={!canUpdateGitHubConnection || !enableProductionSync}
                                />
                              </FormControl_Shadcn_>
                              <div className="absolute top-2.5 right-3 flex items-center gap-2">
                                {isCheckingBranch && <Loader2 size={14} className="animate-spin" />}
                              </div>
                            </div>
                          </FormItemLayout>
                        )}
                      />
                    </div>
                  </div>

                  {/* Automatic Branching Section */}
                  <div className="space-y-4">
                    <FormField_Shadcn_
                      control={githubSettingsForm.control}
                      name="new_branch_per_pr"
                      render={({ field }) => (
                        <FormItemLayout
                          layout="flex-row-reverse"
                          label="Automatic branching"
                          description="Create preview branches for every pull request"
                        >
                          <FormControl_Shadcn_>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={!canCreateGitHubConnection}
                            />
                          </FormControl_Shadcn_>
                        </FormItemLayout>
                      )}
                    />

                    <div
                      className={cn(
                        'space-y-4 pl-6 border-l',
                        !newBranchPerPr && 'opacity-25 pointer-events-none'
                      )}
                    >
                      <FormField_Shadcn_
                        control={githubSettingsForm.control}
                        name="branchLimit"
                        render={({ field }) => (
                          <FormItemLayout
                            layout="flex-row-reverse"
                            label="Branch limit"
                            description="Maximum number of preview branches"
                          >
                            <FormControl_Shadcn_>
                              <Input_Shadcn_
                                {...field}
                                type="number"
                                autoComplete="off"
                                disabled={!newBranchPerPr || !canUpdateGitHubConnection}
                              />
                            </FormControl_Shadcn_>
                          </FormItemLayout>
                        )}
                      />

                      <FormField_Shadcn_
                        control={githubSettingsForm.control}
                        name="supabaseChangesOnly"
                        render={({ field }) => (
                          <FormItemLayout
                            layout="flex-row-reverse"
                            label="Supabase changes only"
                            description="Only create branches when Supabase files change"
                          >
                            <FormControl_Shadcn_>
                              <Switch
                                checked={field.value}
                                onCheckedChange={(val) => field.onChange(val)}
                                disabled={!newBranchPerPr || !canUpdateGitHubConnection}
                              />
                            </FormControl_Shadcn_>
                          </FormItemLayout>
                        )}
                      />
                    </div>
                  </div>
                </form>
              </Form_Shadcn_>
            )}
          </div>

          <SheetFooter>
            <Button
              type="default"
              onClick={() => sidePanelStateSnapshot.setGithubConnectionsOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              onClick={githubSettingsForm.handleSubmit(handleCreateOrUpdateConnection)}
              disabled={
                !canUpdateGitHubConnection ||
                isCheckingBranch ||
                isLoading ||
                !githubSettingsForm.formState.isDirty ||
                gitHubAuthorization === null
              }
              loading={isCheckingBranch || isLoading}
            >
              {isConnected ? 'Update integration' : 'Enable integration'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <ConfirmationModal
        variant="warning"
        visible={isConfirmingBranchChange}
        title="Changing production git branch"
        confirmLabel="Confirm"
        size="medium"
        onCancel={() => setIsConfirmingBranchChange(false)}
        onConfirm={onConfirmBranchChange}
        loading={isUpdatingConnection}
      >
        <p className="text-sm text-foreground-light">
          Open pull requests will only update your Supabase project on merge if the git base branch
          matches this new production git branch.
        </p>
      </ConfirmationModal>

      <ConfirmationModal
        variant="warning"
        visible={isConfirmingRepoChange}
        title="Changing GitHub repository"
        confirmLabel="Change repository"
        size="medium"
        onCancel={() => setIsConfirmingRepoChange(false)}
        onConfirm={onConfirmRepoChange}
        loading={isLoading}
      >
        <div className="space-y-3">
          <p className="text-sm text-foreground-light">
            This will disconnect your current repository and create a new connection with the
            selected repository.
          </p>
          <p className="text-sm text-foreground-light">
            Your existing branch settings will be preserved, but make sure the new repository
            contains the specified branches.
          </p>
        </div>
      </ConfirmationModal>
    </>
  )
}

export default SidePanelGitHubRepoLinker
