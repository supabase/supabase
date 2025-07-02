import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { ChevronDown, Loader2, PlusIcon } from 'lucide-react'
import { useCallback, useEffect, useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'

import { useBranchCreateMutation } from 'data/branches/branch-create-mutation'
import { useBranchUpdateMutation } from 'data/branches/branch-update-mutation'
import { useBranchesQuery } from 'data/branches/branches-query'
import { useCheckGithubBranchValidity } from 'data/integrations/github-branch-check-query'
import { useGitHubAuthorizationQuery } from 'data/integrations/github-authorization-query'
import { useGitHubConnectionCreateMutation } from 'data/integrations/github-connection-create-mutation'
import { useGitHubConnectionDeleteMutation } from 'data/integrations/github-connection-delete-mutation'
import { useGitHubConnectionUpdateMutation } from 'data/integrations/github-connection-update-mutation'
import { useGitHubRepositoriesQuery } from 'data/integrations/github-repositories-query'
import type { GitHubConnection } from 'data/integrations/integrations.types'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { openInstallGitHubIntegrationWindow } from 'lib/github'
import { EMPTY_ARR } from 'lib/void'
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  cn,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Input_Shadcn_,
  Switch,
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  Command_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
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

interface GitHubIntegrationConnectionFormProps {
  disabled?: boolean
  connection?: GitHubConnection
}

const GitHubIntegrationConnectionForm = ({
  disabled = false,
  connection,
}: GitHubIntegrationConnectionFormProps) => {
  const selectedProject = useSelectedProject()
  const selectedOrganization = useSelectedOrganization()
  const [isConfirmingBranchChange, setIsConfirmingBranchChange] = useState(false)
  const [isConfirmingRepoChange, setIsConfirmingRepoChange] = useState(false)
  const [repoComboBoxOpen, setRepoComboboxOpen] = useState(false)
  const isParentProject = !Boolean(selectedProject?.parent_project_ref)

  const canUpdateGitHubConnection = useCheckPermissions(
    PermissionAction.UPDATE,
    'integrations.github_connections'
  )
  const canCreateGitHubConnection = useCheckPermissions(
    PermissionAction.CREATE,
    'integrations.github_connections'
  )

  const { data: gitHubAuthorization, isLoading: isLoadingGitHubAuthorization } =
    useGitHubAuthorizationQuery()

  const { data: githubReposData, isLoading: isLoadingGitHubRepos } = useGitHubRepositoriesQuery<
    any[]
  >({
    enabled: Boolean(gitHubAuthorization),
  })

  const { mutate: updateBranch } = useBranchUpdateMutation()
  const { mutate: createBranch } = useBranchCreateMutation({
    onError: (error) => {
      console.error('Failed to enable branching:', error)
    },
  })

  const { data: existingBranches } = useBranchesQuery(
    { projectRef: selectedProject?.ref },
    { enabled: !!selectedProject?.ref }
  )

  const { mutateAsync: checkGithubBranchValidity, isLoading: isCheckingBranch } =
    useCheckGithubBranchValidity({ onError: () => {} })

  const { mutate: createConnection, isLoading: isCreatingConnection } =
    useGitHubConnectionCreateMutation()

  const { mutateAsync: deleteConnection, isLoading: isDeletingConnection } =
    useGitHubConnectionDeleteMutation({
      onSuccess: () => {
        toast.success('Successfully removed GitHub integration')
      },
    })

  const { mutate: updateConnectionSettings, isLoading: isUpdatingConnection } =
    useGitHubConnectionUpdateMutation()

  const githubRepos = useMemo(
    () =>
      githubReposData?.map((repo: any) => ({
        id: repo.id.toString(),
        name: repo.name,
        installation_id: repo.installation_id,
        default_branch: repo.default_branch || 'main',
      })) ?? EMPTY_ARR,
    [githubReposData]
  )

  const prodBranch = existingBranches?.find((branch) => branch.is_default)

  // Combined GitHub Settings Form
  const GitHubSettingsSchema = z
    .object({
      repositoryId: z.string().min(1, 'Please select a repository'),
      enableProductionSync: z.boolean().default(true),
      branchName: z.string().default('main'),
      new_branch_per_pr: z.boolean().default(true),
      supabaseDirectory: z.string().default('.'),
      supabaseChangesOnly: z.boolean().default(true),
      branchLimit: z.string().default('50'),
    })
    .superRefine(async (val, ctx) => {
      if (val.enableProductionSync && val.branchName && val.branchName.length > 0) {
        const repositoryId = val.repositoryId || connection?.repository.id.toString()
        if (repositoryId) {
          try {
            await checkGithubBranchValidity({
              repositoryId: Number(repositoryId),
              branchName: val.branchName,
            })
          } catch (error) {
            const selectedRepo = githubRepos.find((repo) => repo.id === repositoryId)
            const repoName =
              selectedRepo?.name || connection?.repository.name || 'selected repository'
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `Branch "${val.branchName}" not found in ${repoName}`,
              path: ['branchName'],
            })
          }
        }
      }
    })

  const githubSettingsForm = useForm<z.infer<typeof GitHubSettingsSchema>>({
    resolver: zodResolver(GitHubSettingsSchema),
    mode: 'onSubmit',
    reValidateMode: 'onBlur',
    defaultValues: {
      repositoryId: connection?.repository.id.toString() || '',
      enableProductionSync: true,
      branchName: 'main',
      new_branch_per_pr: true,
      supabaseDirectory: '.',
      supabaseChangesOnly: true,
      branchLimit: '50',
    },
  })

  const enableProductionSync = githubSettingsForm.watch('enableProductionSync')
  const newBranchPerPr = githubSettingsForm.watch('new_branch_per_pr')
  const currentRepositoryId = githubSettingsForm.watch('repositoryId')

  // Calculate selected repository based on current form value
  const selectedRepository = githubRepos.find((repo) => repo.id === currentRepositoryId)

  const handleCreateOrUpdateConnection = async (data: z.infer<typeof GitHubSettingsSchema>) => {
    if (!selectedProject?.ref || !selectedOrganization?.id) return

    try {
      if (connection) {
        // Check if repository is being changed
        if (connection.repository.id.toString() !== data.repositoryId) {
          setIsConfirmingRepoChange(true)
          return
        }
        // Update existing connection
        await handleUpdateConnection(data, connection)
      } else {
        // Create new connection
        const selectedRepo = githubRepos.find((repo) => repo.id === data.repositoryId)
        if (!selectedRepo) {
          toast.error('Please select a repository')
          return
        }
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

    if (!prodBranch?.id) {
      createBranch({
        projectRef: selectedProject.ref,
        branchName: 'main',
        gitBranch: data.branchName,
        is_default: true,
      })
    } else {
      updateBranch({
        id: prodBranch.id,
        projectRef: selectedProject.ref,
        gitBranch: data.branchName,
      })
    }
    toast.success('GitHub integration successfully updated')
  }

  const handleUpdateConnection = async (
    data: z.infer<typeof GitHubSettingsSchema>,
    currentConnection: GitHubConnection
  ) => {
    if (!selectedProject?.ref || !selectedOrganization?.id) return

    const originalBranchName = prodBranch?.git_branch

    if (originalBranchName && data.branchName !== originalBranchName && data.enableProductionSync) {
      setIsConfirmingBranchChange(true)
      return
    }

    await executeUpdate(data, currentConnection)
  }

  const executeUpdate = async (
    data: z.infer<typeof GitHubSettingsSchema>,
    currentConnection: GitHubConnection
  ) => {
    if (!selectedProject?.ref || !selectedOrganization?.id) return

    updateConnectionSettings({
      connectionId: currentConnection.id,
      organizationId: selectedOrganization.id,
      connection: {
        workdir: data.supabaseDirectory,
        supabase_changes_only: data.supabaseChangesOnly,
        branch_limit: Number(data.branchLimit),
        new_branch_per_pr: data.new_branch_per_pr,
      },
    })

    if (prodBranch?.id) {
      updateBranch({
        id: prodBranch.id,
        projectRef: selectedProject.ref,
        gitBranch: data.enableProductionSync ? data.branchName : '',
      })
    }

    toast.success('GitHub integration successfully updated')
    setIsConfirmingBranchChange(false)
  }

  const onConfirmBranchChange = async () => {
    if (connection) {
      await executeUpdate(githubSettingsForm.getValues(), connection)
    }
  }

  const handleRemoveIntegration = async () => {
    if (!connection || !selectedOrganization?.id) return

    try {
      await deleteConnection({
        organizationId: selectedOrganization.id,
        connectionId: connection.id,
      })

      githubSettingsForm.reset({
        repositoryId: '',
        enableProductionSync: true,
        branchName: 'main',
        new_branch_per_pr: true,
        supabaseDirectory: '.',
        supabaseChangesOnly: true,
        branchLimit: '50',
      })
    } catch (error) {
      console.error('Error removing integration:', error)
      toast.error('Failed to remove integration')
    }
  }

  const onConfirmRepoChange = async () => {
    const data = githubSettingsForm.getValues()
    const selectedRepo = githubRepos.find((repo) => repo.id === data.repositoryId)

    if (!selectedRepo || !connection) return

    try {
      await deleteConnection({
        organizationId: selectedOrganization!.id,
        connectionId: connection.id,
      })

      await handleCreateConnection(data, selectedRepo)

      setIsConfirmingRepoChange(false)
    } catch (error) {
      console.error('Error changing repository:', error)
      toast.error('Failed to change repository')
    }
  }

  useEffect(() => {
    if (selectedRepository) {
      githubSettingsForm.setValue(
        'branchName',
        githubRepos.find((repo) => repo.id === selectedRepository.id)?.default_branch || 'main'
      )
    }
  }, [selectedRepository])

  useEffect(() => {
    if (connection) {
      const hasGitBranch = Boolean(prodBranch?.git_branch?.trim())

      githubSettingsForm.reset({
        repositoryId: connection.repository.id.toString(),
        enableProductionSync: hasGitBranch,
        branchName: prodBranch?.git_branch || 'main',
        new_branch_per_pr: connection.new_branch_per_pr,
        supabaseDirectory: connection.workdir || '',
        supabaseChangesOnly: connection.supabase_changes_only,
        branchLimit: String(connection.branch_limit),
      })
    }
  }, [connection, prodBranch, githubSettingsForm])

  // Handle clearing branch name when production sync is disabled
  useEffect(() => {
    if (!enableProductionSync) {
      githubSettingsForm.setValue('branchName', '')
    } else if (enableProductionSync && !githubSettingsForm.getValues().branchName) {
      githubSettingsForm.setValue('branchName', 'main')
    }
  }, [enableProductionSync, githubSettingsForm])

  // Show authorization prompt if not authorized
  if (gitHubAuthorization === null) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-sm text-center">Authorize with GitHub</p>
          <p className="text-sm text-center text-foreground-light mb-4">
            Connect your GitHub account to access and select repositories for integration.
          </p>
          <Button
            onClick={() => {
              openInstallGitHubIntegrationWindow('authorize')
            }}
          >
            Authorize GitHub
          </Button>
        </CardContent>
      </Card>
    )
  }

  const isLoading = isCreatingConnection || isUpdatingConnection || isDeletingConnection

  return (
    <>
      <Form_Shadcn_ {...githubSettingsForm}>
        <form
          onSubmit={githubSettingsForm.handleSubmit(handleCreateOrUpdateConnection)}
          className={cn(!isParentProject && 'opacity-25 pointer-events-none')}
        >
          <Card>
            <CardContent className="space-y-6">
              {/* Repository Selection */}
              <FormField_Shadcn_
                control={githubSettingsForm.control}
                name="repositoryId"
                render={({ field }) => (
                  <FormItemLayout
                    layout="flex-row-reverse"
                    label="GitHub Repository"
                    description={
                      connection
                        ? 'Change the connected repository'
                        : 'Select the repository to connect to your project'
                    }
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
                            {selectedRepository || connection
                              ? selectedRepository?.name || connection?.repository.name
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
            </CardContent>
            <CardContent className={cn(!currentRepositoryId && 'opacity-25 pointer-events-none')}>
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
                        disabled={disabled || !canUpdateGitHubConnection}
                      />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
            </CardContent>
            <CardContent className={cn(!currentRepositoryId && 'opacity-25 pointer-events-none')}>
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
                          disabled={disabled || !canUpdateGitHubConnection}
                        />
                      </FormControl_Shadcn_>
                    </FormItemLayout>
                  )}
                />

                <div
                  className={cn(
                    'space-y-4 pl-6 border-l',
                    (!enableProductionSync || disabled) && 'opacity-25 pointer-events-none'
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
                              disabled={
                                disabled || !canUpdateGitHubConnection || !enableProductionSync
                              }
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
            </CardContent>
            <CardContent className={cn(!currentRepositoryId && 'opacity-25 pointer-events-none')}>
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
                          disabled={disabled || !canCreateGitHubConnection}
                        />
                      </FormControl_Shadcn_>
                    </FormItemLayout>
                  )}
                />

                <div
                  className={cn(
                    'space-y-4 pl-6 border-l',
                    (!newBranchPerPr || disabled) && 'opacity-25 pointer-events-none'
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
                            disabled={!newBranchPerPr || disabled || !canUpdateGitHubConnection}
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
                            disabled={!newBranchPerPr || disabled || !canUpdateGitHubConnection}
                          />
                        </FormControl_Shadcn_>
                      </FormItemLayout>
                    )}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between items-center">
              <div>
                {connection && (
                  <Button
                    type="outline"
                    onClick={handleRemoveIntegration}
                    disabled={disabled || isDeletingConnection}
                    loading={isDeletingConnection}
                  >
                    Disable integration
                  </Button>
                )}
              </div>
              <div className="flex space-x-2">
                {githubSettingsForm.formState.isDirty && (
                  <Button
                    type="default"
                    onClick={() => {
                      githubSettingsForm.reset()
                    }}
                    disabled={disabled || !canUpdateGitHubConnection}
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  type="primary"
                  htmlType="submit"
                  disabled={
                    disabled ||
                    (!connection && !canCreateGitHubConnection) ||
                    (connection && !canUpdateGitHubConnection) ||
                    isCheckingBranch ||
                    isLoading ||
                    (!connection && !githubSettingsForm.getValues().repositoryId) ||
                    (connection && !githubSettingsForm.formState.isDirty)
                  }
                  loading={isCheckingBranch || isLoading}
                >
                  {connection ? 'Save changes' : 'Enable integration'}
                </Button>
              </div>
            </CardFooter>
          </Card>
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
            selected repository. All existing Supabase branches that are connected to the old
            repository will no longer be synced.
          </p>
        </div>
      </ConfirmationModal>
    </>
  )
}

export default GitHubIntegrationConnectionForm
