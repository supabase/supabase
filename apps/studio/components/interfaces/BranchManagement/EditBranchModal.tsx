import { zodResolver } from '@hookform/resolvers/zod'
import { Check, Github, Loader2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'

import { useParams } from 'common'
import AlertError from 'components/ui/AlertError'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useBranchUpdateMutation } from 'data/branches/branch-update-mutation'
import { Branch, useBranchesQuery } from 'data/branches/branches-query'
import { useCheckGithubBranchValidity } from 'data/integrations/github-branch-check-query'
import { useGitHubConnectionsQuery } from 'data/integrations/github-connections-query'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { BASE_PATH } from 'lib/constants'
import { sidePanelsState } from 'state/side-panels'
import {
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

interface EditBranchModalProps {
  branch?: Branch
  visible: boolean
  onClose: () => void
}

export const EditBranchModal = ({ branch, visible, onClose }: EditBranchModalProps) => {
  const { ref } = useParams()
  const projectDetails = useSelectedProject()
  const selectedOrg = useSelectedOrganization()

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
  const { mutateAsync: checkGithubBranchValidity, isLoading: isChecking } =
    useCheckGithubBranchValidity({
      onError: () => {},
    })

  const { mutate: updateBranch, isLoading: isUpdating } = useBranchUpdateMutation({
    onSuccess: (data) => {
      toast.success(`Successfully updated branch "${data.name}"`)
      onClose()
    },
    onError: (error) => {
      toast.error(`Failed to update branch: ${error.message}`)
    },
  })

  const githubConnection = connections?.find((connection) => connection.project.ref === projectRef)
  const [repoOwner, repoName] = githubConnection?.repository.name.split('/') ?? []

  const formId = 'edit-branch-form'
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
          (val) =>
            // Allow the current branch name during edit
            val === branch?.name || (branches ?? []).every((b) => b.name !== val),
          'A branch with this name already exists'
        ),
      gitBranchName: z.string().optional(),
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
        // If git branch is empty or removed, it's valid
        setIsGitBranchValid(!val.gitBranchName || val.gitBranchName.length === 0)
      }
    })

  const form = useForm<z.infer<typeof FormSchema>>({
    mode: 'onBlur',
    reValidateMode: 'onChange',
    resolver: zodResolver(FormSchema),
    defaultValues: { branchName: '', gitBranchName: '' },
  })

  const isFormValid =
    form.formState.isValid && (!form.getValues('gitBranchName') || isGitBranchValid)
  const canSubmit = isFormValid && !isUpdating && !isChecking

  const onSubmit = (data: z.infer<typeof FormSchema>) => {
    if (!projectRef) return console.error('Project ref is required')
    if (!branch?.id) return console.error('Branch ID is required')

    const payload: {
      projectRef: string
      id: string
      branchName: string
      gitBranch?: string
    } = {
      projectRef,
      id: branch.id,
      branchName: data.branchName,
    }

    // Only add gitBranch to the payload if it is present and valid
    // If gitBranchName is empty or invalid, gitBranch remains undefined in the payload
    if (data.gitBranchName && isGitBranchValid) {
      payload.gitBranch = data.gitBranchName
    }

    updateBranch(payload)
  }

  // Pre-fill form when the modal becomes visible and branch data is available
  useEffect(() => {
    if (visible && branch) {
      setIsGitBranchValid(!!branch.git_branch) // Initial validity based on existing link
      form.reset({
        branchName: branch.name ?? '',
        gitBranchName: branch.git_branch ?? '',
      })
    }
  }, [branch, visible, form])

  // Handle initial state and changes for git branch validity
  useEffect(() => {
    setIsGitBranchValid(
      !form.getValues('gitBranchName') || form.getValues('gitBranchName')?.length === 0
    )
    // Trigger validation if a git branch name exists initially or is entered
    if (form.getValues('gitBranchName')) {
      form.trigger('gitBranchName')
    }
  }, [githubConnection?.id, form.getValues('gitBranchName'), form.trigger, visible, branch])

  const openLinkerPanel = () => {
    onClose()
    sidePanelsState.setGithubConnectionsOpen(true)
  }

  return (
    <Dialog open={visible} onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="large" hideClose>
        <DialogHeader padding="small">
          <DialogTitle>Edit branch "{branch?.name}"</DialogTitle> {/* Update title */}
        </DialogHeader>
        <DialogSectionSeparator />
        <Form_Shadcn_ {...form}>
          <form id={formId} onSubmit={form.handleSubmit(onSubmit)}>
            <DialogSection padding="medium" className="space-y-4">
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
                    <FormItem_Shadcn_>
                      <div className="flex items-center justify-between mb-2">
                        <Label>Link to Git Branch (Optional)</Label>
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
                        If linked, migrations from this Git branch will be automatically deployed.
                      </p>
                      <FormMessage_Shadcn_ />
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
              {isSuccessConnections && !githubConnection && (
                <div className="flex items-center gap-2 justify-between">
                  <div>
                    <Label>GitHub Repository</Label>
                    <p className="text-sm text-foreground-light">
                      Optionally connect to a GitHub repository to manage migrations automatically
                      for this branch.
                    </p>
                  </div>
                  <Button type="default" icon={<Github />} onClick={openLinkerPanel}>
                    Connect to GitHub
                  </Button>
                </div>
              )}
            </DialogSection>

            <DialogFooter padding="medium">
              <Button disabled={isUpdating} type="default" onClick={onClose}>
                Cancel
              </Button>
              <Button
                form={formId}
                disabled={!isSuccessConnections || isUpdating || !canSubmit || isChecking}
                loading={isUpdating}
                type="primary"
                htmlType="submit"
              >
                Update branch
              </Button>
            </DialogFooter>
          </form>
        </Form_Shadcn_>
      </DialogContent>
    </Dialog>
  )
}
