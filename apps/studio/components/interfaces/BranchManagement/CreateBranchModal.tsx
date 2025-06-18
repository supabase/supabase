import { zodResolver } from '@hookform/resolvers/zod'
import { useParams } from 'common'
import { Check, DollarSign, FileText, Github, Loader2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'

import AlertError from 'components/ui/AlertError'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useBranchCreateMutation } from 'data/branches/branch-create-mutation'
import { useBranchesQuery } from 'data/branches/branches-query'
import { useCheckGithubBranchValidity } from 'data/integrations/github-branch-check-query'
import { useGitHubConnectionsQuery } from 'data/integrations/github-connections-query'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { useFlag } from 'hooks/ui/useFlag'
import { useProjectAddonsQuery } from 'data/subscriptions/project-addons-query'
import { BASE_PATH } from 'lib/constants'
import { sidePanelsState } from 'state/side-panels'
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
  FormItem_Shadcn_,
  FormMessage_Shadcn_,
  Form_Shadcn_,
  Input_Shadcn_,
  Label_Shadcn_ as Label,
  cn,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { BranchingPITRNotice } from 'components/layouts/AppLayout/EnableBranchingButton/BranchingPITRNotice'
import { useQueryClient } from '@tanstack/react-query'
import { projectKeys } from 'data/projects/keys'

interface CreateBranchModalProps {
  visible: boolean
  onClose: () => void
}

export const CreateBranchModal = ({ visible, onClose }: CreateBranchModalProps) => {
  const { ref } = useParams()
  const projectDetails = useSelectedProject()
  const selectedOrg = useSelectedOrganization()
  const gitlessBranching = useFlag('gitlessBranching')

  const [isGitBranchValid, setIsGitBranchValid] = useState(false)

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

  const queryClient = useQueryClient()

  const { mutate: createBranch, isLoading: isCreating } = useBranchCreateMutation({
    onSuccess: async (data) => {
      toast.success(`Successfully created preview branch "${data.name}"`)
      if (projectRef) {
        await Promise.all([queryClient.invalidateQueries(projectKeys.detail(projectRef))])
      }
      onClose()
    },
    onError: (error) => {
      toast.error(`Failed to create branch: ${error.message}`)
    },
  })

  const githubConnection = connections?.find((connection) => connection.project.ref === projectRef)

  // Fetch production/default branch to inspect git_branch linkage
  const prodBranch = branches?.find((branch) => branch.is_default)

  const [repoOwner, repoName] = githubConnection?.repository.name.split('/') ?? []

  const isProdBranchLinked = Boolean(
    prodBranch?.git_branch && prodBranch.git_branch.trim().length > 0
  )

  const isBranchingEnabled = gitlessBranching || (!!githubConnection && isProdBranchLinked)

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
          (val) => !githubConnection?.id || (val && val.length > 0),
          'Git branch name is required when Git is connected'
        ),
    })
    .superRefine(async (val, ctx) => {
      if (val.gitBranchName && val.gitBranchName.length > 0 && githubConnection?.id) {
        try {
          await checkGithubBranchValidity({
            connectionId: githubConnection.id,
            branchName: val.gitBranchName,
          })
          setIsGitBranchValid(true)
        } catch (error) {
          setIsGitBranchValid(false)
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Unable to find branch "${val.gitBranchName}" in ${repoOwner}/${repoName}`,
            path: ['gitBranchName'],
          })
        }
      } else {
        setIsGitBranchValid(!val.gitBranchName || val.gitBranchName.length === 0)
      }
    })

  const form = useForm<z.infer<typeof FormSchema>>({
    mode: 'onBlur',
    reValidateMode: 'onChange',
    resolver: zodResolver(FormSchema),
    defaultValues: { branchName: '', gitBranchName: '' },
  })

  // Show validation messages only after a field has been interacted with (touched) or on form submit
  const { touchedFields, isSubmitted } = form.formState

  const showBranchNameError = touchedFields.branchName || isSubmitted
  const showGitBranchNameError = touchedFields.gitBranchName || isSubmitted

  const isFormValid =
    form.formState.isValid && (!form.getValues('gitBranchName') || isGitBranchValid)
  const canSubmit = isFormValid && !isCreating && !isChecking && isBranchingEnabled

  const onSubmit = (data: z.infer<typeof FormSchema>) => {
    if (!projectRef) return console.error('Project ref is required')
    createBranch({
      projectRef,
      branchName: data.branchName,
      ...(data.gitBranchName && isGitBranchValid ? { gitBranch: data.gitBranchName } : {}),
    })
  }

  useEffect(() => {
    if (form && visible) {
      setIsGitBranchValid(false)
      form.reset()
    }
  }, [form, visible])

  useEffect(() => {
    setIsGitBranchValid(
      !form.getValues('gitBranchName') || form.getValues('gitBranchName')?.length === 0
    )
  }, [githubConnection?.id, form.getValues('gitBranchName')])

  const openLinkerPanel = () => {
    onClose()
    sidePanelsState.setGithubConnectionsOpen(true)
  }

  return (
    <Dialog open={visible} onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="large" hideClose>
        <DialogHeader padding="small">
          <DialogTitle>Create a new preview branch</DialogTitle>
        </DialogHeader>
        <DialogSectionSeparator />
        <Form_Shadcn_ {...form}>
          <form id={formId} onSubmit={form.handleSubmit(onSubmit)}>
            <DialogSection padding="medium" className="space-y-4">
              <FormField_Shadcn_
                control={form.control}
                name="branchName"
                render={({ field }) => (
                  <FormItemLayout label="Preview Branch Name" hideMessage={!showBranchNameError}>
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

              {githubConnection && isProdBranchLinked && (
                <FormField_Shadcn_
                  control={form.control}
                  name="gitBranchName"
                  render={({ field }) => (
                    <FormItem_Shadcn_>
                      <div className="flex items-center justify-between mb-2">
                        <Label>Sync with Git branch {gitlessBranching ? '(optional)' : ''}</Label>
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
                      <div className="relative">
                        <FormControl_Shadcn_>
                          <Input_Shadcn_
                            {...field}
                            placeholder="e.g. main, feat/some-feature"
                            autoComplete="off"
                          />
                        </FormControl_Shadcn_>
                        <div className="absolute top-2 right-3 flex items-center gap-2">
                          {isChecking && <Loader2 size={14} className="animate-spin" />}
                          {field.value && !isChecking && isGitBranchValid && (
                            <Check size={14} className="text-brand" strokeWidth={2} />
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-foreground-light mt-2">
                        Migrations from this Git branch will be automatically deployed
                      </p>
                      {showGitBranchNameError && <FormMessage_Shadcn_ />}
                    </FormItem_Shadcn_>
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
                  {(!githubConnection || !isProdBranchLinked) && (
                    <div className="flex items-center gap-2 justify-between">
                      <div>
                        <Label>Automatic branching</Label>
                        <p className="text-sm text-foreground-light">
                          Automatically create, sync, and merge branches in Supabase when you make
                          changes to your GitHub repository.
                        </p>
                      </div>
                      <Button type="default" icon={<Github />} onClick={openLinkerPanel}>
                        Configure
                      </Button>
                    </div>
                  )}
                </>
              )}
            </DialogSection>

            <DialogSectionSeparator />

            <DialogSection padding="medium" className="flex flex-col gap-4">
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
                      Migration files in your <code className="text-xs">./supabase</code> directory
                      will run on both Preview Branches and Production when pushing and merging
                      branches.
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
                    Preview branches are billed $0.32 per day
                  </p>
                  <p className="text-sm text-foreground-light">
                    This cost will continue for as long as the branch has not been removed.
                  </p>
                </div>
              </div>

              {!hasPitrEnabled && <BranchingPITRNotice />}
            </DialogSection>

            <DialogSectionSeparator />

            <DialogFooter className="justify-end gap-2" padding="medium">
              <Button disabled={isCreating} type="default" onClick={onClose}>
                Cancel
              </Button>
              <Button
                form={formId}
                disabled={!isSuccessConnections || isCreating || !canSubmit || isChecking}
                loading={isCreating}
                type="primary"
                htmlType="submit"
              >
                Create branch
              </Button>
            </DialogFooter>
          </form>
        </Form_Shadcn_>
      </DialogContent>
    </Dialog>
  )
}
