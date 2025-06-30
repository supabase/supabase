import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Loader2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'

import { useBranchUpdateMutation } from 'data/branches/branch-update-mutation'
import { useBranchesQuery } from 'data/branches/branches-query'
import { useCheckGithubBranchValidity } from 'data/integrations/github-branch-check-query'
import { useGitHubConnectionUpdateMutation } from 'data/integrations/github-connection-update-mutation'
import type { GitHubConnection } from 'data/integrations/integrations.types'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
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
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

interface GitHubIntegrationConnectionFormProps {
  disabled?: boolean
  connection: GitHubConnection
}

const GitHubIntegrationConnectionForm = ({
  disabled = false,
  connection,
}: GitHubIntegrationConnectionFormProps) => {
  const selectedProject = useSelectedProject()
  const selectedOrganization = useSelectedOrganization()
  const [isConfirmingBranchChange, setIsConfirmingBranchChange] = useState(false)

  const canUpdateGitHubConnection = useCheckPermissions(
    PermissionAction.UPDATE,
    'integrations.github_connections'
  )
  const canCreateGitHubConnection = useCheckPermissions(
    PermissionAction.CREATE,
    'integrations.github_connections'
  )

  const { mutate: updateBranch } = useBranchUpdateMutation()

  const { data: existingBranches } = useBranchesQuery(
    { projectRef: selectedProject?.ref },
    { enabled: !!selectedProject?.ref }
  )

  const { mutateAsync: checkGithubBranchValidity, isLoading: isCheckingBranch } =
    useCheckGithubBranchValidity({ onError: () => {} })

  const { mutate: updateConnectionSettings, isLoading: isUpdatingConnection } =
    useGitHubConnectionUpdateMutation()

  const prodBranch = existingBranches?.find((branch) => branch.is_default)

  // Combined GitHub Settings Form
  const GitHubSettingsSchema = z
    .object({
      enableProductionSync: z.boolean().default(false),
      branchName: z.string(),
      new_branch_per_pr: z.boolean().default(false),
      supabaseDirectory: z.string().default(''),
      supabaseChangesOnly: z.boolean().default(false),
      branchLimit: z.string().default('50'),
    })
    .superRefine(async (val, ctx) => {
      if (val.enableProductionSync && connection && val.branchName && val.branchName.length > 0) {
        try {
          await checkGithubBranchValidity({
            repositoryId: connection.repository.id,
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
    })

  const githubSettingsForm = useForm<z.infer<typeof GitHubSettingsSchema>>({
    resolver: zodResolver(GitHubSettingsSchema),
    mode: 'onSubmit',
    reValidateMode: 'onBlur',
    defaultValues: {
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

  const onSubmitGitHubSettings = async (data: z.infer<typeof GitHubSettingsSchema>) => {
    const originalBranchName = prodBranch?.git_branch

    if (originalBranchName && data.branchName !== originalBranchName && data.enableProductionSync) {
      setIsConfirmingBranchChange(true)
    } else {
      await executeGitHubSettingsSave(data)
    }
  }

  const executeGitHubSettingsSave = async (data: z.infer<typeof GitHubSettingsSchema>) => {
    if (!selectedProject?.ref || !selectedOrganization) return

    // Handle automatic branching validation
    if (data.new_branch_per_pr && !selectedOrganization) {
      return console.error('Organization not selected')
    }

    if (data.new_branch_per_pr && !connection) {
      return toast.error('Please connect to a repository first.')
    }

    // Handle branch update (branching should already be enabled via GitHub connection)
    if (prodBranch?.id) {
      console.log('Updating existing branch:', prodBranch)
      // Update existing branch
      updateBranch({
        id: prodBranch.id,
        projectRef: selectedProject.ref,
        gitBranch: data.enableProductionSync ? data.branchName : '',
      })
    }

    // Update connection settings if connection exists
    if (connection) {
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
    }

    toast.success('GitHub integration updated successfully')
    setIsConfirmingBranchChange(false)
  }

  const onConfirmBranchChange = async () => {
    await executeGitHubSettingsSave(githubSettingsForm.getValues())
  }

  useEffect(() => {
    const hasGitBranch = Boolean(prodBranch?.git_branch?.trim())

    githubSettingsForm.reset({
      enableProductionSync: hasGitBranch,
      branchName: prodBranch?.git_branch || 'main',
      new_branch_per_pr: connection.new_branch_per_pr,
      supabaseDirectory: connection.workdir || '',
      supabaseChangesOnly: connection.supabase_changes_only,
      branchLimit: String(connection.branch_limit),
    })
  }, [connection, prodBranch, githubSettingsForm])

  // Handle clearing branch name when production sync is disabled
  useEffect(() => {
    if (!enableProductionSync) {
      githubSettingsForm.setValue('branchName', '')
    } else if (enableProductionSync && !githubSettingsForm.getValues().branchName) {
      githubSettingsForm.setValue('branchName', 'main')
    }
  }, [enableProductionSync, githubSettingsForm])

  return (
    <>
      <Form_Shadcn_ {...githubSettingsForm}>
        <form onSubmit={githubSettingsForm.handleSubmit(onSubmitGitHubSettings)}>
          <Card>
            <CardContent>
              <FormField_Shadcn_
                control={githubSettingsForm.control}
                name="supabaseDirectory"
                render={({ field }) => (
                  <FormItemLayout
                    layout="flex-row-reverse"
                    label="Supabase directory"
                    description="Relaive path to your supabase folder"
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
            <CardContent className="space-y-6">
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
            <CardContent>
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
            <CardFooter className="justify-end space-x-2">
              {githubSettingsForm.formState.isDirty && (
                <Button
                  type="default"
                  onClick={() => githubSettingsForm.reset()}
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
                  !canUpdateGitHubConnection ||
                  isCheckingBranch ||
                  isUpdatingConnection ||
                  !githubSettingsForm.formState.isDirty
                }
                loading={isCheckingBranch || isUpdatingConnection}
              >
                Save changes
              </Button>
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
    </>
  )
}

export default GitHubIntegrationConnectionForm
