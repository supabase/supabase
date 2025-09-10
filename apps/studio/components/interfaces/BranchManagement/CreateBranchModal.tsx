import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useQueryClient } from '@tanstack/react-query'
import { DatabaseZap, DollarSign, GitMerge, Github, Loader2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'

import { useFlag, useParams } from 'common'
import { useIsBranching2Enabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { BranchingPITRNotice } from 'components/layouts/AppLayout/EnableBranchingButton/BranchingPITRNotice'
import AlertError from 'components/ui/AlertError'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { InlineLink, InlineLinkClassName } from 'components/ui/InlineLink'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import UpgradeToPro from 'components/ui/UpgradeToPro'
import { useBranchCreateMutation } from 'data/branches/branch-create-mutation'
import { useBranchesQuery } from 'data/branches/branches-query'
import { useDiskAttributesQuery } from 'data/config/disk-attributes-query'
import { useCheckGithubBranchValidity } from 'data/integrations/github-branch-check-query'
import { useGitHubConnectionsQuery } from 'data/integrations/github-connections-query'
import { projectKeys } from 'data/projects/keys'
import { DesiredInstanceSize, instanceSizeSpecs } from 'data/projects/new-project.constants'
import { useProjectAddonsQuery } from 'data/subscriptions/project-addons-query'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useAsyncCheckProjectPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  cn,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import ShimmeringLoader from 'ui-patterns/ShimmeringLoader'
import {
  estimateComputeSize,
  estimateDiskCost,
  estimateRestoreTime,
} from './BranchManagement.utils'

export const CreateBranchModal = () => {
  const { ref } = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: projectDetails } = useSelectedProjectQuery()
  const { data: selectedOrg } = useSelectedOrganizationQuery()
  const { showCreateBranchModal, setShowCreateBranchModal } = useAppStateSnapshot()

  const gitlessBranching = useIsBranching2Enabled()
  const allowDataBranching = useFlag('allowDataBranching')

  const { can: canCreateBranch } = useAsyncCheckProjectPermissions(
    PermissionAction.CREATE,
    'preview_branches'
  )

  const isProPlanAndUp = selectedOrg?.plan?.id !== 'free'
  const promptProPlanUpgrade = IS_PLATFORM && !isProPlanAndUp

  const isBranch = projectDetails?.parent_project_ref !== undefined
  const projectRef =
    projectDetails !== undefined ? (isBranch ? projectDetails.parent_project_ref : ref) : undefined
  const noPhysicalBackups = !projectDetails?.is_physical_backups_enabled

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
  const withData = form.watch('withData')

  const {
    data: connections,
    error: connectionsError,
    isLoading: isLoadingConnections,
    isSuccess: isSuccessConnections,
    isError: isErrorConnections,
  } = useGitHubConnectionsQuery(
    { organizationId: selectedOrg?.id },
    { enabled: showCreateBranchModal }
  )

  const { data: branches } = useBranchesQuery({ projectRef })
  const { data: addons, isSuccess: isSuccessAddons } = useProjectAddonsQuery(
    { projectRef },
    { enabled: showCreateBranchModal }
  )
  const computeAddon = addons?.selected_addons.find((addon) => addon.type === 'compute_instance')
  const computeSize = !!computeAddon
    ? (computeAddon.variant.identifier.split('ci_')[1] as DesiredInstanceSize)
    : undefined
  const hasPitrEnabled =
    (addons?.selected_addons ?? []).find((addon) => addon.type === 'pitr') !== undefined

  const {
    data: disk,
    isLoading: isLoadingDiskAttr,
    isError: isErrorDiskAttr,
  } = useDiskAttributesQuery({ projectRef }, { enabled: showCreateBranchModal && withData })
  const projectDiskAttributes = disk?.attributes ?? {
    type: 'gp3',
    size_gb: 0,
    iops: 0,
    throughput_mbps: 0,
  }
  // Branch disk is oversized to include backup files, it should be scaled back eventually.
  const branchDiskAttributes = {
    ...projectDiskAttributes,
    // [Joshen] JFYI for Qiao - this multiplier may eventually be dropped
    size_gb: Math.round(projectDiskAttributes.size_gb * 1.5),
  }
  const branchComputeSize = estimateComputeSize(projectDiskAttributes.size_gb, computeSize)
  const estimatedDiskCost = estimateDiskCost(branchDiskAttributes)

  const { mutate: sendEvent } = useSendEventMutation()

  const { mutateAsync: checkGithubBranchValidity, isLoading: isCheckingGHBranchValidity } =
    useCheckGithubBranchValidity({
      onError: () => {},
    })

  const { mutate: createBranch, isLoading: isCreatingBranch } = useBranchCreateMutation({
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

  // Fetch production/default branch to inspect git_branch linkage
  const githubConnection = connections?.find((connection) => connection.project.ref === projectRef)
  const prodBranch = branches?.find((branch) => branch.is_default)
  const [repoOwner, repoName] = githubConnection?.repository.name.split('/') ?? []

  const isDisabled =
    !canCreateBranch ||
    !isSuccessAddons ||
    !isSuccessConnections ||
    promptProPlanUpgrade ||
    (!gitlessBranching && !githubConnection) ||
    isCreatingBranch ||
    isCheckingGHBranchValidity

  const onSubmit = (data: z.infer<typeof FormSchema>) => {
    if (!projectRef) return console.error('Project ref is required')
    createBranch({
      projectRef,
      branchName: data.branchName,
      is_default: false,
      ...(data.withData ? { desired_instance_size: computeSize } : {}),
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
          if (promptProPlanUpgrade) e.preventDefault()
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
                          {isCheckingGHBranchValidity && (
                            <Loader2 size={14} className="animate-spin" />
                          )}
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
                      label={
                        <>
                          <Label className="mr-2">Include data</Label>
                          {noPhysicalBackups && (
                            <Badge variant="warning" size="small">
                              Requires PITR
                            </Badge>
                          )}
                        </>
                      }
                      layout="flex-row-reverse"
                      className="[&>div>label]:mb-1"
                      description="Clone production data into this branch"
                    >
                      <FormControl_Shadcn_>
                        <Switch
                          disabled={noPhysicalBackups}
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
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
              {withData && (
                <div className="flex flex-row gap-4">
                  <div>
                    <figure className="w-10 h-10 rounded-md bg-info-200 border border-info-400 flex items-center justify-center">
                      <DatabaseZap className="text-info" size={20} strokeWidth={2} />
                    </figure>
                  </div>
                  <div className="flex flex-col gap-y-1">
                    {isLoadingDiskAttr ? (
                      <>
                        <ShimmeringLoader className="w-32 h-5 py-0" />
                        <ShimmeringLoader className="w-72 h-8 py-0" />
                      </>
                    ) : (
                      <>
                        {isErrorDiskAttr ? (
                          <>
                            <p className="text-sm text-foreground">
                              Branch disk size will incur additional cost per month
                            </p>
                            <p className="text-sm text-foreground-light">
                              The additional cost and time taken to create a data branch is relative
                              to the size of your database. We are unable to provide an estimate as
                              we were unable to retrieve your project's disk configuration
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="text-sm text-foreground">
                              Branch disk size is billed at ${estimatedDiskCost.total.toFixed(2)}{' '}
                              per month
                            </p>
                            <p className="text-sm text-foreground-light">
                              Creating a data branch will take about{' '}
                              <span className="text-foreground">
                                {estimateRestoreTime(branchDiskAttributes).toFixed()} minutes
                              </span>{' '}
                              and costs{' '}
                              <span className="text-foreground">
                                ${estimatedDiskCost.total.toFixed(2)}
                              </span>{' '}
                              per month based on your current target database volume size of{' '}
                              {branchDiskAttributes.size_gb} GB and your{' '}
                              <Tooltip>
                                <TooltipTrigger>
                                  <span className={InlineLinkClassName}>
                                    project's disk configuration
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent side="bottom">
                                  <div className="flex items-center gap-x-2">
                                    <p className="w-24">Disk type:</p>
                                    <p className="w-16">
                                      {branchDiskAttributes.type.toUpperCase()}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-x-2">
                                    <p className="w-24">Targer disk size:</p>
                                    <p className="w-16">{branchDiskAttributes.size_gb} GB</p>
                                    <p>(${estimatedDiskCost.size.toFixed(2)})</p>
                                  </div>
                                  <div className="flex items-center gap-x-2">
                                    <p className="w-24">IOPs:</p>
                                    <p className="w-16">{branchDiskAttributes.iops} IOPS</p>
                                    <p>(${estimatedDiskCost.iops.toFixed(2)})</p>
                                  </div>
                                  {'throughput_mbps' in branchDiskAttributes && (
                                    <div className="flex items-center gap-x-2">
                                      <p className="w-24">Throughput:</p>
                                      <p className="w-16">
                                        {branchDiskAttributes.throughput_mbps} MB/s
                                      </p>
                                      <p>(${estimatedDiskCost.throughput.toFixed(2)})</p>
                                    </div>
                                  )}
                                  <p className="mt-2">
                                    More info in{' '}
                                    <InlineLink
                                      onClick={() => setShowCreateBranchModal(false)}
                                      className="pointer-events-auto"
                                      href={`/project/${ref}/settings/compute-and-disk`}
                                    >
                                      Compute and Disk
                                    </InlineLink>
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                              .
                            </p>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

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
                          <span className="text-foreground">{prodBranch.git_branch}</span>,
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
                  <p className="text-sm text-foreground">
                    Branch compute is billed at $
                    {withData ? branchComputeSize.priceHourly : instanceSizeSpecs.micro.priceHourly}{' '}
                    per hour
                  </p>
                  <p className="text-sm text-foreground-light">
                    {withData ? (
                      <>
                        <code className="text-xs font-mono">{branchComputeSize.label}</code> compute
                        size is automatically selected to match your production branch. You may
                        downgrade after creation or pause the branch when not in use to save cost.
                      </>
                    ) : (
                      <>This cost will continue for as long as the branch has not been removed.</>
                    )}
                  </p>
                </div>
              </div>

              {!hasPitrEnabled && <BranchingPITRNotice />}
            </DialogSection>

            <DialogFooter className="justify-end gap-2" padding="medium">
              <Button
                type="default"
                disabled={isCreatingBranch}
                onClick={() => setShowCreateBranchModal(false)}
              >
                Cancel
              </Button>
              <ButtonTooltip
                form={formId}
                disabled={isDisabled}
                loading={isCreatingBranch}
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
