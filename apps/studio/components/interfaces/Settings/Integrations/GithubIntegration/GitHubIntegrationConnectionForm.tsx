import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { AnimatePresence, motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  cn,
  Form,
  FormControl,
  FormField,
  Input_Shadcn_,
  Switch,
} from 'ui'
import { Admonition } from 'ui-patterns/admonition'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import * as z from 'zod'

import {
  GitHubRepositoryField,
  useGitHubRepositoryOptions,
} from '@/components/interfaces/Settings/Integrations/GithubIntegration/GitHubRepositoryField'
import { InlineLink } from '@/components/ui/InlineLink'
import { UpgradeToPro } from '@/components/ui/UpgradeToPro'
import { useBranchCreateMutation } from '@/data/branches/branch-create-mutation'
import { useBranchUpdateMutation } from '@/data/branches/branch-update-mutation'
import { useBranchesQuery } from '@/data/branches/branches-query'
import { useCheckGithubBranchValidity } from '@/data/integrations/github-branch-check-query'
import { useGitHubConnectionCreateMutation } from '@/data/integrations/github-connection-create-mutation'
import { useGitHubConnectionDeleteMutation } from '@/data/integrations/github-connection-delete-mutation'
import { useGitHubConnectionUpdateMutation } from '@/data/integrations/github-connection-update-mutation'
import type { GitHubConnection } from '@/data/integrations/integrations.types'
import { useCheckEntitlements } from '@/hooks/misc/useCheckEntitlements'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { DOCS_URL } from '@/lib/constants'

interface GitHubIntegrationConnectionFormProps {
  connection?: GitHubConnection
}

export const GitHubIntegrationConnectionForm = ({
  connection,
}: GitHubIntegrationConnectionFormProps) => {
  const { data: selectedProject } = useSelectedProjectQuery()
  const { data: selectedOrganization } = useSelectedOrganizationQuery()
  const [isConfirmingBranchChange, setIsConfirmingBranchChange] = useState(false)
  const [isConfirmingRepoChange, setIsConfirmingRepoChange] = useState(false)
  const isParentProject = !selectedProject?.parent_project_ref

  const { hasAccess: hasAccessToGitHubIntegration, isLoading: isLoadingEntitlements } =
    useCheckEntitlements('integrations.github_connections')

  const { hasAccess: hasAccessToBranching } = useCheckEntitlements('branching_limit')

  const { can: canUpdateGitHubConnection } = useAsyncCheckPermissions(
    PermissionAction.UPDATE,
    'integrations.github_connections'
  )
  const { can: canCreateGitHubConnection } = useAsyncCheckPermissions(
    PermissionAction.CREATE,
    'integrations.github_connections'
  )

  const {
    gitHubAuthorization,
    githubRepos,
    hasPartialResponseDueToSSO,
    isLoading: isLoadingRepositoryOptions,
    refetch: refetchRepositoryOptions,
  } = useGitHubRepositoryOptions()

  const { mutate: updateBranch } = useBranchUpdateMutation({
    onSuccess: () => {
      toast.success('Production branch settings successfully updated')
    },
  })
  const { mutate: createBranch } = useBranchCreateMutation({
    onSuccess: () => {
      toast.success('Production branch settings successfully updated')
    },
    onError: (error) => {
      console.error('Failed to enable branching:', error)
    },
  })

  const { data: existingBranches } = useBranchesQuery(
    { projectRef: selectedProject?.ref },
    { enabled: !!selectedProject?.ref }
  )

  const { mutateAsync: checkGithubBranchValidity, isPending: isCheckingBranch } =
    useCheckGithubBranchValidity({ onError: () => {} })

  const { mutate: createConnection, isPending: isCreatingConnection } =
    useGitHubConnectionCreateMutation({
      onSuccess: () => {
        toast.success('GitHub integration successfully updated')
      },
      onError: (error) => {
        // Don't show error toast when connection already exists - the branch
        // settings update will still proceed and show its own success toast
        if (!error.message?.includes('already exists')) {
          toast.error(`Failed to create GitHub connection: ${error.message}`)
        }
      },
    })

  const { mutateAsync: deleteConnection, isPending: isDeletingConnection } =
    useGitHubConnectionDeleteMutation({
      onSuccess: () => {
        toast.success('Successfully removed GitHub integration')
      },
    })

  const { mutate: updateConnectionSettings, isPending: isUpdatingConnection } =
    useGitHubConnectionUpdateMutation()

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
          } catch {
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
      branchLimit: '3',
    },
  })

  const enableProductionSync = githubSettingsForm.watch('enableProductionSync')
  const newBranchPerPr = githubSettingsForm.watch('new_branch_per_pr')
  const currentRepositoryId = githubSettingsForm.watch('repositoryId')

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

    if (!prodBranch) {
      createBranch({
        projectRef: selectedProject.ref,
        branchName: 'main',
        gitBranch: data.branchName,
        is_default: true,
      })
    } else {
      updateBranch({
        branchRef: prodBranch.project_ref,
        projectRef: selectedProject.ref,
        gitBranch: data.branchName,
      })
    }
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

    if (prodBranch) {
      updateBranch({
        branchRef: prodBranch.project_ref,
        projectRef: selectedProject.ref,
        gitBranch: data.enableProductionSync ? data.branchName : '',
        branchName: data.branchName || 'main',
      })
    } else {
      // if for some reason, the project doesn't have a default branch yet, create it.
      createBranch({
        projectRef: selectedProject.ref,
        gitBranch: data.enableProductionSync ? data.branchName : '',
        branchName: data.branchName || 'main',
        is_default: true,
      })
    }

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
        branchLimit: '3',
      })
    } catch (error) {
      console.error('Error removing integration:', error)
      toast.error('Failed to remove integration')
    }
  }

  const onConfirmRepoChange = async () => {
    const data = githubSettingsForm.getValues()
    const selectedRepo = githubRepos.find((repo) => repo.id === data.repositoryId)

    if (!selectedRepo || !connection || !selectedOrganization?.id) return

    try {
      await deleteConnection({
        organizationId: selectedOrganization.id,
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

  const isLoading =
    isLoadingEntitlements ||
    isCreatingConnection ||
    isUpdatingConnection ||
    isDeletingConnection ||
    isLoadingRepositoryOptions

  return (
    <>
      <Form {...githubSettingsForm}>
        <form
          onSubmit={githubSettingsForm.handleSubmit(handleCreateOrUpdateConnection)}
          className={cn(!isParentProject && 'opacity-25 pointer-events-none')}
        >
          <Card>
            <CardContent className="space-y-6">
              <GitHubRepositoryField
                form={githubSettingsForm}
                name="repositoryId"
                label="GitHub Repository"
                layout="flex-row-reverse"
                description={
                  connection
                    ? 'Change the connected repository'
                    : 'Select the repository to connect to your project'
                }
                disabled={
                  (!connection && !canCreateGitHubConnection) ||
                  (connection && !canUpdateGitHubConnection)
                }
                selectedRepositoryName={connection?.repository.name}
                repositories={githubRepos}
                gitHubAuthorization={gitHubAuthorization}
                hasPartialResponseDueToSSO={hasPartialResponseDueToSSO}
                isLoading={isLoadingRepositoryOptions}
                refetch={refetchRepositoryOptions}
                onRepositorySelect={(repo) => {
                  githubSettingsForm.setValue('branchName', repo.default_branch || 'main')
                }}
              />
            </CardContent>

            <AnimatePresence>
              {gitHubAuthorization !== null && !!currentRepositoryId && (
                <motion.div
                  initial={{ opacity: 0, y: -16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                >
                  <CardContent>
                    <FormField
                      control={githubSettingsForm.control}
                      name="supabaseDirectory"
                      render={({ field }) => (
                        <FormItemLayout
                          layout="flex-row-reverse"
                          label="Working directory"
                          description={
                            <>
                              Relative path to the directory containing your{' '}
                              <code className="text-code-inline whitespace-nowrap">supabase/</code>{' '}
                              folder.{' '}
                              <InlineLink
                                href={`${DOCS_URL}/guides/deployment/branching/github-integration#set-the-working-directory`}
                              >
                                Learn more
                              </InlineLink>
                            </>
                          }
                        >
                          <FormControl>
                            <Input_Shadcn_
                              {...field}
                              placeholder="."
                              autoComplete="off"
                              disabled={!canUpdateGitHubConnection}
                            />
                          </FormControl>
                        </FormItemLayout>
                      )}
                    />
                  </CardContent>
                  <CardContent>
                    {/* Production Branch Sync Section */}
                    <div className="space-y-4">
                      <FormField
                        control={githubSettingsForm.control}
                        name="enableProductionSync"
                        render={({ field }) => (
                          <FormItemLayout
                            layout="flex-row-reverse"
                            label="Deploy to production"
                            description="Deploy changes to production on push including PR merges"
                          >
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                disabled={!canUpdateGitHubConnection}
                              />
                            </FormControl>
                          </FormItemLayout>
                        )}
                      />

                      <div
                        className={cn(
                          'space-y-4 pl-6 border-l',
                          !enableProductionSync && 'opacity-25 pointer-events-none'
                        )}
                      >
                        <FormField
                          control={githubSettingsForm.control}
                          name="branchName"
                          render={({ field }) => (
                            <FormItemLayout
                              layout="flex-row-reverse"
                              label="Production branch name"
                              description="The GitHub branch to sync with your production database (e.g., main, master)"
                            >
                              <div className="relative w-full">
                                <FormControl>
                                  <Input_Shadcn_
                                    {...field}
                                    autoComplete="off"
                                    disabled={!canUpdateGitHubConnection || !enableProductionSync}
                                  />
                                </FormControl>
                                <div className="absolute top-2.5 right-3 flex items-center gap-2">
                                  {isCheckingBranch && (
                                    <Loader2 size={14} className="animate-spin" />
                                  )}
                                </div>
                              </div>
                            </FormItemLayout>
                          )}
                        />
                      </div>
                    </div>
                  </CardContent>
                  <CardContent>
                    {hasAccessToBranching ? (
                      <Admonition type="warning" title="Branching and billing" className="mb-4">
                        Branching Compute is not covered by your organization&apos;s Spend Cap.
                        Costs should be closely monitored, as they may be incurred.{' '}
                        <InlineLink
                          href={`${DOCS_URL}/guides/platform/cost-control#usage-items-not-covered-by-the-spend-cap`}
                        >
                          Learn more
                        </InlineLink>
                      </Admonition>
                    ) : (
                      <UpgradeToPro
                        className="mb-4"
                        layout="vertical"
                        source="projectIntegrations"
                        featureProposition="automatically create preview branches from pull requests"
                        primaryText="Branching with GitHub integration"
                        secondaryText="Upgrade to the Pro Plan to enable branching and automatically create preview branches for every pull request"
                        docsUrl={`${DOCS_URL}/guides/deployment/branching`}
                      />
                    )}

                    {/* Automatic Branching Section */}
                    <div className="space-y-4">
                      <FormField
                        disabled={!hasAccessToBranching}
                        control={githubSettingsForm.control}
                        name="new_branch_per_pr"
                        render={({ field }) => (
                          <FormItemLayout
                            layout="flex-row-reverse"
                            label="Automatic branching"
                            className={cn(!hasAccessToBranching && 'opacity-25')}
                            description="Create preview branches for every pull request"
                          >
                            <FormControl>
                              <Switch
                                checked={!hasAccessToBranching ? false : field.value}
                                onCheckedChange={field.onChange}
                                disabled={!hasAccessToBranching || !canCreateGitHubConnection}
                              />
                            </FormControl>
                          </FormItemLayout>
                        )}
                      />

                      <div
                        className={cn(
                          'space-y-4 pl-6 border-l',
                          (!hasAccessToBranching || !newBranchPerPr) &&
                            'opacity-25 pointer-events-none'
                        )}
                      >
                        <FormField
                          control={githubSettingsForm.control}
                          name="branchLimit"
                          render={({ field }) => (
                            <FormItemLayout
                              layout="flex-row-reverse"
                              label="Branch limit"
                              description="Maximum number of preview branches"
                            >
                              <FormControl>
                                <Input_Shadcn_
                                  {...field}
                                  type="number"
                                  autoComplete="off"
                                  value={!hasAccessToBranching ? 0 : field.value}
                                  disabled={
                                    !hasAccessToBranching ||
                                    !newBranchPerPr ||
                                    !canUpdateGitHubConnection
                                  }
                                />
                              </FormControl>
                            </FormItemLayout>
                          )}
                        />

                        <FormField
                          control={githubSettingsForm.control}
                          name="supabaseChangesOnly"
                          render={({ field }) => (
                            <FormItemLayout
                              layout="flex-row-reverse"
                              label="Supabase changes only"
                              description="Only create branches when Supabase files change"
                            >
                              <FormControl>
                                <Switch
                                  checked={!hasAccessToBranching ? false : field.value}
                                  onCheckedChange={(val) => field.onChange(val)}
                                  disabled={
                                    !hasAccessToBranching ||
                                    !newBranchPerPr ||
                                    !canUpdateGitHubConnection
                                  }
                                />
                              </FormControl>
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
                          disabled={isDeletingConnection || isCheckingBranch}
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
                          onClick={() => githubSettingsForm.reset()}
                          disabled={!canUpdateGitHubConnection || isCheckingBranch}
                        >
                          Cancel
                        </Button>
                      )}
                      <Button
                        type="primary"
                        htmlType="submit"
                        disabled={
                          !hasAccessToGitHubIntegration ||
                          (!connection && !canCreateGitHubConnection) ||
                          (connection && !canUpdateGitHubConnection) ||
                          isCheckingBranch ||
                          isLoading ||
                          (!connection && !githubSettingsForm.getValues().repositoryId) ||
                          (connection && !githubSettingsForm.formState.isDirty)
                        }
                        loading={isLoading}
                      >
                        {connection ? 'Save changes' : 'Enable integration'}
                      </Button>
                    </div>
                  </CardFooter>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </form>
      </Form>

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
