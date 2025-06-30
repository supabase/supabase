import { zodResolver } from '@hookform/resolvers/zod'
import { last } from 'lodash'
import { Check, DollarSign, ExternalLink, FileText, GitBranch, Github, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'

import { useQueryClient } from '@tanstack/react-query'
import { useParams } from 'common'
import SidePanelGitHubRepoLinker from 'components/interfaces/Organization/IntegrationSettings/SidePanelGitHubRepoLinker'
import AlertError from 'components/ui/AlertError'
import { DocsButton } from 'components/ui/DocsButton'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useBranchCreateMutation } from 'data/branches/branch-create-mutation'
import { useCheckGithubBranchValidity } from 'data/integrations/github-branch-check-query'
import { useGitHubConnectionsQuery } from 'data/integrations/github-connections-query'
import { projectKeys } from 'data/projects/keys'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useProjectAddonsQuery } from 'data/subscriptions/project-addons-query'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { useFlag } from 'hooks/ui/useFlag'
import { useRouter } from 'next/router'
import { useAppStateSnapshot } from 'state/app-state'
import { sidePanelsState } from 'state/side-panels'
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  FormMessage_Shadcn_,
  Input_Shadcn_,
  Label_Shadcn_ as Label,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { BranchingPITRNotice } from './BranchingPITRNotice'
import { BranchingPlanNotice } from './BranchingPlanNotice'
import { BranchingPostgresVersionNotice } from './BranchingPostgresVersionNotice'

export const EnableBranchingModal = () => {
  const router = useRouter()
  const { ref } = useParams()
  const snap = useAppStateSnapshot()
  const queryClient = useQueryClient()
  const project = useSelectedProject()
  const selectedOrg = useSelectedOrganization()
  const gitlessBranching = useFlag('gitlessBranching')

  const [isGitBranchValid, setIsGitBranchValid] = useState(false)

  const {
    data: connections,
    error: connectionsError,
    isLoading: isLoadingConnections,
    isSuccess: isSuccessConnections,
    isError: isErrorConnections,
  } = useGitHubConnectionsQuery(
    {
      organizationId: selectedOrg?.id,
    },
    { enabled: snap.showEnableBranchingModal }
  )

  const hasMinimumPgVersion =
    Number(last(project?.dbVersion?.split('-') ?? [])?.split('.')[0] ?? 0) >= 15

  const { data: subscription } = useOrgSubscriptionQuery({ orgSlug: selectedOrg?.slug })
  const isFreePlan = subscription?.plan.id === 'free'

  const { data: addons } = useProjectAddonsQuery({ projectRef: ref })
  const hasPitrEnabled =
    (addons?.selected_addons ?? []).find((addon) => addon.type === 'pitr') !== undefined

  const githubConnection = connections?.find((connection) => connection.project.ref === ref)
  const [repoOwner, repoName] = githubConnection?.repository.name.split('/') ?? []

  const { mutateAsync: checkGithubBranchValidity, isLoading: isChecking } =
    useCheckGithubBranchValidity({ onError: () => {} })

  const { mutate: createBranch, isLoading: isCreating } = useBranchCreateMutation({
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries(projectKeys.detail(ref)),
        queryClient.invalidateQueries(projectKeys.list()),
      ])
      toast.success(`Successfully enabled branching`)
      snap.setShowEnableBranchingModal(false)
      router.push(`/project/${ref}/branches`)
    },
    onError: (error) => {
      toast.error(`Failed to enable branching: ${error.message}`)
    },
  })

  const formId = 'enable-branching-form'
  const FormSchema = z
    .object({
      productionBranchName: z
        .string()
        .min(1, 'Production branch name cannot be empty')
        .refine(
          (val) => /^[a-zA-Z0-9\-_]+$/.test(val),
          'Branch name can only contain alphanumeric characters, hyphens, and underscores.'
        ),
      branchName: z.string().optional(),
    })
    .superRefine(async (val, ctx) => {
      if (githubConnection && (!val.branchName || val.branchName.length === 0)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'GitHub branch is required when a repository is connected.',
          path: ['branchName'],
        })
        setIsGitBranchValid(false)
        return
      }

      if (githubConnection && val.branchName && val.branchName.length > 0) {
        try {
          await checkGithubBranchValidity({
            connectionId: githubConnection.id,
            branchName: val.branchName,
          })
          setIsGitBranchValid(true)
        } catch (error) {
          setIsGitBranchValid(false)
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Unable to find branch "${val.branchName}" in ${repoOwner}/${repoName}`,
            path: ['branchName'],
          })
        }
      } else {
        setIsGitBranchValid(true)
      }
    })

  const form = useForm<z.infer<typeof FormSchema>>({
    mode: 'onBlur',
    reValidateMode: 'onChange',
    resolver: zodResolver(FormSchema),
    defaultValues: { productionBranchName: 'main', branchName: '' },
  })

  const isLoading = isLoadingConnections
  const isError = isErrorConnections
  const isSuccess = isSuccessConnections

  const isFormValid = form.formState.isValid
  const canSubmit =
    isFormValid && !isCreating && !isChecking && (gitlessBranching || !!githubConnection)

  const onSubmit = (data: z.infer<typeof FormSchema>) => {
    if (!ref) return console.error('Project ref is required')
    createBranch({
      projectRef: ref,
      branchName: data.productionBranchName,
      ...(data.branchName && isGitBranchValid ? { gitBranch: data.branchName } : {}),
    })
  }

  const openLinkerPanel = () => {
    snap.setShowEnableBranchingModal(false)
    sidePanelsState.setGithubConnectionsOpen(true)
  }

  useEffect(() => {
    if (snap.showEnableBranchingModal) {
      form.reset({ productionBranchName: 'main', branchName: '' })
      setIsGitBranchValid(false)
    }
  }, [form, snap.showEnableBranchingModal])

  useEffect(() => {
    setIsGitBranchValid(!form.getValues('branchName') || form.getValues('branchName')?.length === 0)
  }, [githubConnection?.id, form.getValues('branchName')])

  return (
    <>
      <Dialog
        open={snap.showEnableBranchingModal}
        onOpenChange={(open) => !open && snap.setShowEnableBranchingModal(false)}
      >
        <DialogContent size="large" hideClose>
          <Form_Shadcn_ {...form}>
            <form id={formId} onSubmit={form.handleSubmit(onSubmit)}>
              <DialogHeader padding="small">
                <div className="flex items-start justify-between gap-x-4">
                  <div className="flex items-center gap-x-4">
                    <GitBranch strokeWidth={2} size={20} />
                    <div>
                      <DialogTitle>Enable database branching</DialogTitle>
                      <DialogDescription>Manage environments in Supabase</DialogDescription>
                    </div>
                  </div>
                  <DocsButton href="https://supabase.com/docs/guides/platform/branching" />
                </div>
              </DialogHeader>

              {isLoading && (
                <div>
                  <DialogSectionSeparator />
                  <DialogSection padding="medium">
                    <GenericSkeletonLoader />
                  </DialogSection>
                  <DialogSectionSeparator />
                </div>
              )}
              {isError && (
                <div>
                  <DialogSectionSeparator />
                  <DialogSection padding="medium">
                    <AlertError error={connectionsError} subject="Failed to retrieve connections" />
                  </DialogSection>
                  <DialogSectionSeparator />
                </div>
              )}
              {isSuccess && (
                <>
                  {isFreePlan ? (
                    <DialogSection className="!p-0">
                      <BranchingPlanNotice />
                    </DialogSection>
                  ) : !hasMinimumPgVersion ? (
                    <DialogSection padding="medium">
                      <BranchingPostgresVersionNotice />
                    </DialogSection>
                  ) : (
                    <>
                      <DialogSectionSeparator />
                      <DialogSection padding="medium" className="space-y-4">
                        <FormField_Shadcn_
                          control={form.control}
                          name="productionBranchName"
                          render={({ field }) => (
                            <FormItemLayout label="Production Branch Name">
                              <FormControl_Shadcn_>
                                <Input_Shadcn_
                                  {...field}
                                  placeholder="e.g. main, production"
                                  autoComplete="off"
                                />
                              </FormControl_Shadcn_>
                            </FormItemLayout>
                          )}
                        />
                        {githubConnection ? (
                          <>
                            <FormField_Shadcn_
                              control={form.control}
                              name="branchName"
                              render={({ field }) => (
                                <FormItem_Shadcn_ className="relative">
                                  <div className="flex items-center justify-between mb-2">
                                    <Label>
                                      Link GitHub Branch{' '}
                                      {githubConnection && (
                                        <span className="text-destructive">*</span>
                                      )}
                                    </Label>
                                    <div className="flex items-center gap-2 text-sm">
                                      <Github size={14} />
                                      <Link
                                        href={`https://github.com/${repoOwner}/${repoName}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-foreground hover:underline"
                                      >
                                        {repoOwner}/{repoName}
                                      </Link>
                                      <Link
                                        href={`https://github.com/${repoOwner}/${repoName}`}
                                        target="_blank"
                                        rel="noreferrer"
                                      >
                                        <ExternalLink size={14} strokeWidth={1.5} />
                                      </Link>
                                    </div>
                                  </div>
                                  <FormControl_Shadcn_>
                                    <Input_Shadcn_
                                      {...field}
                                      placeholder="e.g. main"
                                      autoComplete="off"
                                    />
                                  </FormControl_Shadcn_>
                                  <div className="absolute top-9 right-3 flex items-center gap-2">
                                    {isChecking && <Loader2 size={14} className="animate-spin" />}
                                    {field.value && !isChecking && isGitBranchValid && (
                                      <Check size={14} className="text-brand" strokeWidth={2} />
                                    )}
                                  </div>
                                  <FormMessage_Shadcn_ className="mt-1" />
                                </FormItem_Shadcn_>
                              )}
                            />
                          </>
                        ) : (
                          <div className="flex items-center gap-2 justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <Label>GitHub Repository</Label>
                                {!gitlessBranching && (
                                  <Badge variant="warning" size="small">
                                    Required
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-foreground-light">
                                {gitlessBranching
                                  ? 'Optionally connect to a GitHub repository to enable deploying previews on Pull Requests and manage migrations automatically.'
                                  : 'Connect to a GitHub repository to enable database branching. This allows you to deploy previews on Pull Requests and manage migrations automatically.'}
                              </p>
                            </div>
                            <Button type="default" icon={<Github />} onClick={openLinkerPanel}>
                              Connect to GitHub
                            </Button>
                          </div>
                        )}
                      </DialogSection>
                    </>
                  )}
                  <DialogSectionSeparator />

                  <DialogSection padding="medium" className="flex flex-col gap-4">
                    <h3 className="text-sm text-foreground">Please keep in mind the following:</h3>

                    {githubConnection && (
                      <div className="flex flex-row gap-4">
                        <div>
                          <figure className="w-10 h-10 rounded-md bg-info-200 border border-info-400 flex items-center justify-center">
                            <FileText className="text-info" size={20} strokeWidth={2} />
                          </figure>
                        </div>
                        <div className="flex flex-col gap-y-1">
                          <p className="text-sm text-foreground">
                            Migrations are applied from your GitHub repository
                          </p>
                          <p className="text-sm text-foreground-light">
                            Migration files in your <code className="text-xs">./supabase</code>{' '}
                            directory will run on both Preview Branches and Production when pushing
                            and merging branches.
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
                          Preview branches are billed $0.01344 per hour
                        </p>
                        <p className="text-sm text-foreground-light">
                          This cost will continue for as long as the branch has not been removed.
                        </p>
                      </div>
                    </div>
                    {!hasPitrEnabled && <BranchingPITRNotice />}
                  </DialogSection>
                  <DialogSectionSeparator />
                </>
              )}

              <DialogFooter className="justify-end gap-2" padding="small">
                <Button
                  size="medium"
                  disabled={isCreating}
                  type="default"
                  onClick={() => snap.setShowEnableBranchingModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  block
                  size="medium"
                  form={formId}
                  disabled={!isSuccess || isCreating || !canSubmit || isChecking || isFreePlan}
                  loading={isCreating}
                  type="primary"
                  htmlType="submit"
                >
                  I understand, enable branching
                </Button>
              </DialogFooter>
            </form>
          </Form_Shadcn_>
        </DialogContent>
      </Dialog>

      <SidePanelGitHubRepoLinker projectRef={ref} />
    </>
  )
}
