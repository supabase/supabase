import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { DollarSign, GitMerge, Github, Loader2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'

import { useParams } from 'common'
import { useIsBranching2Enabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { BranchingPITRNotice } from 'components/layouts/AppLayout/EnableBranchingButton/BranchingPITRNotice'
import AlertError from 'components/ui/AlertError'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import UpgradeToPro from 'components/ui/UpgradeToPro'
import { useBranchCreateMutation } from 'data/branches/branch-create-mutation'
import { useBranchesQuery } from 'data/branches/branches-query'
import { useCheckGithubBranchValidity } from 'data/integrations/github-branch-check-query'
import { useGitHubConnectionsQuery } from 'data/integrations/github-connections-query'
import { projectKeys } from 'data/projects/keys'
import { useProjectAddonsQuery } from 'data/subscriptions/project-addons-query'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { BASE_PATH, IS_PLATFORM } from 'lib/constants'
import { useAppStateSnapshot } from 'state/app-state'
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Form_Shadcn_,
  Input_Shadcn_,
  Label_Shadcn_ as Label,
  Switch,
  cn,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useFlag } from 'hooks/ui/useFlag'

export const CreateBranchModal = () => {
  const allowDataBranching = useFlag('allowDataBranching')
  const { ref } = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const projectDetails = useSelectedProject()
  const selectedOrg = useSelectedOrganization()
  const gitlessBranching = useIsBranching2Enabled()
  const { showCreateBranchModal, setShowCreateBranchModal } = useAppStateSnapshot()

  const organization = useSelectedOrganization()
  const isProPlanAndUp = organization?.plan?.id !== 'free'
  const promptProPlanUpgrade = IS_PLATFORM && !isProPlanAndUp

  const isBranch = projectDetails?.parent_project_ref !== undefined
  const projectRef =
    projectDetails !== undefined ? (isBranch ? projectDetails.parent_project_ref : ref) : undefined

  const {
    data: connections,
    error: connectionsError,
    isLoading: isLoadingConnections,
    isSuccess: isSuccessConnections,
    isError: isErrorConnections,
  } = useGitHubConnectionsQuery({
    organizationId: selectedOrg?.id,
  })

  const { data: branches } = useBranchesQuery({ projectRef })
  const { data: addons } = useProjectAddonsQuery({ projectRef })
  const hasPitrEnabled =
    (addons?.selected_addons ?? []).find((addon) => addon.type === 'pitr') !== undefined
  const { mutateAsync: checkGithubBranchValidity, isLoading: isChecking } =
    useCheckGithubBranchValidity({
      onError: () => {},
    })

  const { mutate: sendEvent } = useSendEventMutation()

  const { mutate: createBranch, isLoading: isCreating } = useBranchCreateMutation({
    onSuccess: async (data) => {
      toast.success(`Successfully created preview branch "${data.name}"`)
      if (projectRef) {
        await Promise.all([queryClient.invalidateQueries(projectKeys.detail(projectRef))])
      }
      sendEvent({
        action: 'branch_create_button_clicked',
        properties: {
          branchType: data.persistent ? 'persistent' : 'preview',
          gitlessBranching,
        },
        groups: {
          project: ref ?? 'Unknown',
          organization: selectedOrg?.slug ?? 'Unknown',
        },
      })

      setShowCreateBranchModal(false)
      router.push(`/project/${data.project_ref}`)
    },
    onError: (error) => {
      toast.error(`Failed to create branch: ${error.message}`)
    },
  })

  const canCreateBranch = useCheckPermissions(PermissionAction.CREATE, 'preview_branches')

  const githubConnection = connections?.find((connection) => connection.project.ref === projectRef)

  // Fetch production/default branch to inspect git_branch linkage
  const prodBranch = branches?.find((branch) => branch.is_default)

  const [repoOwner, repoName] = githubConnection?.repository.name.split('/') ?? []

  const formId = 'create-branch-form'
  const FormSchema = z
    .object({
      branchName: z
        .string()
        .min(1, 'Branch name cannot be empty')
        .refine(
          (val) => /^[a-zA-Z0-9\-_]+$/.test(val),
          'Branch name can only contain alphanumeric characters, hyphens, and underscores.'
        )
        .refine(
          (val) => (branches ?? []).every((branch) => branch.name !== val),
          'A branch with this name already exists'
        ),
      gitBranchName: z
        .string()
        .refine(
          (val) => gitlessBranching || !githubConnection || (val && val.length > 0),
          'Git branch name is required when GitHub is connected'
        ),
      withData: z.boolean().default(false).optional(),
    })
    .superRefine(async (val, ctx) => {
      if (val.gitBranchName && val.gitBranchName.length > 0 && githubConnection?.repository.id) {
        try {
          await checkGithubBranchValidity({
            repositoryId: githubConnection.repository.id,
            branchName: val.gitBranchName,
          })
          // valid – no issues added
        } catch (error) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Unable to find branch "${val.gitBranchName}" in ${repoOwner}/${repoName}`,
            path: ['gitBranchName'],
          })
        }
      }
    })

  const form = useForm<z.infer<typeof FormSchema>>({
    mode: 'onSubmit',
    reValidateMode: 'onBlur',
    resolver: zodResolver(FormSchema),
    defaultValues: { branchName: '', gitBranchName: '', withData: false },
  })

  const canSubmit = !isCreating && !isChecking
  const isDisabled =
    !isSuccessConnections ||
    isCreating ||
    !canSubmit ||
    isChecking ||
    (!gitlessBranching && !githubConnection) ||
    promptProPlanUpgrade ||
    !canCreateBranch

  const onSubmit = (data: z.infer<typeof FormSchema>) => {
    if (!projectRef) return console.error('Project ref is required')
    createBranch({
      projectRef,
      branchName: data.branchName,
      is_default: false,
      ...(data.gitBranchName ? { gitBranch: data.gitBranchName } : {}),
      ...(allowDataBranching ? { withData: data.withData } : {}),
    })
  }

  const handleGitHubClick = () => {
    setShowCreateBranchModal(false)
    router.push(`/project/${projectRef}/settings/integrations`)
  }

  useEffect(() => {
    if (form && showCreateBranchModal) {
      form.reset()
    }
  }, [form, showCreateBranchModal])

  return (
    <Dialog open={showCreateBranchModal} onOpenChange={(open) => setShowCreateBranchModal(open)}>
      <DialogContent
        size="large"
        hideClose
        onOpenAutoFocus={(e) => {
          if (promptProPlanUpgrade) {
            e.preventDefault()
          }
        }}
      >
        <DialogHeader padding="small">
          <DialogTitle>Create a new preview branch</DialogTitle>
        </DialogHeader>
        <DialogSectionSeparator />

        <Form_Shadcn_ {...form}>
          <form id={formId} onSubmit={form.handleSubmit(onSubmit)}>
            {promptProPlanUpgrade && (
              <>
                <UpgradeToPro
                  primaryText="Upgrade to unlock branching"
                  secondaryText="Create and test schema changes, functions, and more in a separate, temporary instance without affecting production"
                  source="create-branch"
                />
                <DialogSectionSeparator />
              </>
            )}

            <DialogSection
              padding="medium"
              className={cn('space-y-4', promptProPlanUpgrade && 'opacity-25 pointer-events-none')}
            >
              <FormField_Shadcn_
                control={form.control}
                name="branchName"
                render={({ field }) => (
                  <FormItemLayout label="Preview Branch Name">
                    <FormControl_Shadcn_>
                      <Input_Shadcn_
                        {...field}
                        placeholder="e.g. staging, dev-feature-x"
                        autoComplete="off"
                      />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />

              {githubConnection && (
                <FormField_Shadcn_
                  control={form.control}
                  name="gitBranchName"
                  render={({ field }) => (
                    <FormItemLayout
                      label={
                        <div className="flex items-center justify-between w-full gap-4">
                          <span className="flex-1">
                            Sync with Git branch {gitlessBranching ? '(optional)' : ''}
                          </span>
                          <div className="flex items-center gap-2 text-sm">
                            <Image
                              className={cn('dark:invert')}
                              src={`${BASE_PATH}/img/icons/github-icon.svg`}
                              width={16}
                              height={16}
                              alt={`GitHub icon`}
                            />
                            <Link
                              href={`https://github.com/${repoOwner}/${repoName}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-foreground hover:underline"
                            >
                              {repoOwner}/{repoName}
                            </Link>
                          </div>
                        </div>
                      }
                      description="Automatically deploy changes on every commit"
                    >
                      <div className="relative w-full">
                        <FormControl_Shadcn_>
                          <Input_Shadcn_
                            {...field}
                            placeholder="e.g. main, feat/some-feature"
                            autoComplete="off"
                          />
                        </FormControl_Shadcn_>
                        <div className="absolute top-2.5 right-3 flex items-center gap-2">
                          {isChecking && <Loader2 size={14} className="animate-spin" />}
                        </div>
                      </div>
                    </FormItemLayout>
                  )}
                />
              )}

              {isLoadingConnections && <GenericSkeletonLoader />}
              {isErrorConnections && (
                <AlertError
                  error={connectionsError}
                  subject="Failed to retrieve GitHub connection information"
                />
              )}
              {isSuccessConnections && (
                <>
                  {!githubConnection && (
                    <div className="flex items-center gap-2 justify-between">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <Label>Sync with a GitHub branch</Label>
                          {!gitlessBranching && (
                            <Badge variant="warning" size="small">
                              Required
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-foreground-lighter">
                          Keep this preview branch in sync with a chosen GitHub branch
                        </p>
                      </div>
                      <Button type="default" icon={<Github />} onClick={handleGitHubClick}>
                        Configure
                      </Button>
                    </div>
                  )}
                </>
              )}
              {allowDataBranching && (
                <FormField_Shadcn_
                  control={form.control}
                  name="withData"
                  render={({ field }) => (
                    <FormItemLayout
                      label="Include data"
                      layout="flex-row-reverse"
                      description="Clone production data into this branch"
                    >
                      <FormControl_Shadcn_>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl_Shadcn_>
                    </FormItemLayout>
                  )}
                />
              )}
            </DialogSection>

            <DialogSectionSeparator />

            <DialogSection
              padding="medium"
              className={cn(
                'flex flex-col gap-4',
                promptProPlanUpgrade && 'opacity-25 pointer-events-none'
              )}
            >
              {githubConnection && (
                <div className="flex flex-row gap-4">
                  <div>
                    <figure className="w-10 h-10 rounded-md bg-info-200 border border-info-400 flex items-center justify-center">
                      <GitMerge className="text-info" size={20} strokeWidth={2} />
                    </figure>
                  </div>
                  <div className="flex flex-col gap-y-1">
                    <p className="text-sm text-foreground">
                      {prodBranch?.git_branch
                        ? 'Merging to production enabled'
                        : 'Merging to production disabled'}
                    </p>
                    <p className="text-sm text-foreground-light">
                      {prodBranch?.git_branch ? (
                        <>
                          When this branch is merged to{' '}
                          <code className="text-xs font-mono">{prodBranch.git_branch}</code>,
                          migrations will be deployed to production. Otherwise, migrations only run
                          on preview branches.
                        </>
                      ) : (
                        <>
                          Merging this branch to production will not deploy migrations. To enable
                          production deployment, enable "Deploy to production" in project
                          integration settings.
                        </>
                      )}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex flex-row gap-4">
                <div>
                  <figure className="w-10 h-10 rounded-md bg-info-200 border border-info-400 flex items-center justify-center">
                    <DollarSign className="text-info" size={20} strokeWidth={2} />
                  </figure>
                </div>
                <div className="flex flex-col gap-y-1">
                  <p className="text-sm text-foreground">Branches are billed $0.01344 per hour</p>
                  <p className="text-sm text-foreground-light">
                    This cost will continue for as long as the branch has not been removed.
                  </p>
                </div>
              </div>

              {!hasPitrEnabled && <BranchingPITRNotice />}
            </DialogSection>

            <DialogFooter className="justify-end gap-2" padding="medium">
              <Button
                disabled={isCreating}
                type="default"
                onClick={() => setShowCreateBranchModal(false)}
              >
                Cancel
              </Button>
              <ButtonTooltip
                form={formId}
                disabled={isDisabled}
                loading={isCreating}
                type="primary"
                htmlType="submit"
                tooltip={{
                  content: {
                    side: 'bottom',
                    text:
                      !gitlessBranching && !githubConnection
                        ? 'Set up a GitHub connection first to create branches'
                        : undefined,
                  },
                }}
              >
                Create branch
              </ButtonTooltip>
            </DialogFooter>
          </form>
        </Form_Shadcn_>
      </DialogContent>
    </Dialog>
  )
}
